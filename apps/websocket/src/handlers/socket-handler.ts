// apps/websocket/src/handlers/socket-handler.ts
import { WebSocket } from "ws";
import { syncBattleToTelemetry } from "../events/battle.events";
import { ConnectionManager } from "../server/connection-manager";
import { logger } from "@algofight/logger";
import {
    PrismaUserRepository,
    PrismaProblemRepository,
    PrismaBattleRoomRepository,
} from "@algofight/database";
import {
    BattleRoomService,
    RatingService,
    MatchmakingService,
    MockExecutor,
} from "@algofight/application";

export class SocketHandler {
    private readonly userRepo = new PrismaUserRepository();
    private readonly problemRepo = new PrismaProblemRepository();
    private readonly battleRoomRepo = new PrismaBattleRoomRepository();
    private readonly ratingService = new RatingService(this.userRepo);
    private readonly battleRoomService = new BattleRoomService(
        this.battleRoomRepo,
        this.problemRepo,
        this.ratingService,
    );
    private readonly matchmakingService = new MatchmakingService(
        this.userRepo,
        this.battleRoomService,
        this.problemRepo,
    );
    private readonly mockExecutor = new MockExecutor();

    // Map socket -> user session
    private readonly socketUsers = new Map<WebSocket, {
        userId: string;
        username: string;
        rating?: number;
        platformCode?: string;
        roomId?: string;
    }>();

    constructor(private readonly connectionManager: ConnectionManager) { }

    async handleMessage(
        socket: WebSocket,
        rawMessage: string,
        currentUserId: { value: string | null },
    ): Promise<void> {
        try {
            const parsed = JSON.parse(rawMessage);
            const action = parsed.action || parsed.type || parsed.event;
            const data = parsed.data || parsed.payload || parsed;

            switch (action) {
                // 1. Auth & Identification
                case "auth":
                case "identify": {
                    const userId = data.userId || data.uid;
                    const username = data.username || "Player";
                    if (userId) {
                        currentUserId.value = userId;

                        // Query user details from DB to enrich presence
                        let user = await this.userRepo.getUserById(userId).catch(() => null);
                        if (!user && (data.email || data.username)) {
                            user = await this.userRepo.upsertUser({
                                id: userId,
                                email: data.email || `${username.toLowerCase().replace(/\s+/g, "_")}@algofight.local`,
                                username: username,
                            }).catch(() => null);
                        }

                        const userRating = user?.rating || 1200;
                        const platformCode = user?.platformCode || "";
                        const userType = user?.userType || "INDIVIDUAL";
                        const institutionName = user?.institutionName || undefined;

                        this.connectionManager.registerUser(userId, socket, {
                            username: user?.username || username,
                            rating: userRating,
                            platformCode,
                            userType,
                            institutionName,
                            status: "AVAILABLE",
                        });

                        this.socketUsers.set(socket, {
                            userId,
                            username: user?.username || username,
                            rating: userRating,
                            platformCode,
                        });

                        this.send(socket, "authenticated", {
                            userId,
                            username: user?.username || username,
                            rating: userRating,
                            platformCode,
                        });

                        // Broadcast real-time presence change to all users
                        const presence = this.connectionManager.getPresence(userId);
                        if (presence) {
                            this.connectionManager.broadcastToAll("player_presence_update", presence);
                        }

                        // Send current online presences snapshot to this user
                        const onlineList = this.connectionManager.getAllOnlinePresences();
                        this.send(socket, "presence_sync", { onlinePlayers: onlineList });
                    }
                    break;
                }

                // 2. Fetch / Subscribe Available Players
                case "get_available_players":
                case "subscribe_presence": {
                    const onlineList = this.connectionManager.getAllOnlinePresences();
                    this.send(socket, "presence_sync", { onlinePlayers: onlineList });
                    break;
                }

                // 3. Send Direct 1v1 Challenge
                case "send_challenge": {
                    const session = this.socketUsers.get(socket);
                    const fromUserId = session?.userId || currentUserId.value;
                    const fromUsername = session?.username || data.fromUsername || "Challenger";
                    const fromRating = session?.rating || 1200;
                    const { targetUserId, targetUsername } = data;

                    if (!fromUserId) {
                        this.send(socket, "error", "You must be logged in to send a challenge.");
                        break;
                    }

                    if (!targetUserId || targetUserId === fromUserId) {
                        this.send(socket, "error", "Invalid target player for duel challenge.");
                        break;
                    }

                    if (!this.connectionManager.isUserOnline(targetUserId)) {
                        this.send(socket, "error", `${targetUsername || "Player"} is currently offline.`);
                        break;
                    }

                    const challenge = this.connectionManager.createChallenge({
                        fromUserId,
                        fromUsername,
                        fromRating,
                        targetUserId,
                        targetUsername: targetUsername || "Opponent",
                    });

                    if (!challenge) {
                        this.send(socket, "error", "Could not dispatch challenge. Player might be offline.");
                        break;
                    }

                    // Send incoming challenge prompt to target user
                    this.connectionManager.sendToUser(targetUserId, "challenge_received", challenge);

                    // Confirm challenge sent to the challenger
                    this.send(socket, "challenge_sent", challenge);
                    break;
                }

                // 4. Accept Direct Challenge
                case "accept_challenge": {
                    const { challengeId } = data;
                    const challenge = this.connectionManager.getChallenge(challengeId);

                    if (!challenge || challenge.status !== "PENDING") {
                        this.send(socket, "error", "Challenge expired or no longer available.");
                        break;
                    }

                    challenge.status = "ACCEPTED";
                    this.connectionManager.removeChallenge(challengeId);

                    // Create a 1v1 battle room
                    const room = await this.battleRoomService.createRoom({
                        hostId: challenge.fromUserId,
                        maxPlayers: 2,
                        timeLimitMinutes: 15,
                    });

                    // Update both players' presence status
                    this.connectionManager.updatePresenceStatus(challenge.fromUserId, "IN_BATTLE", room.id);
                    this.connectionManager.updatePresenceStatus(challenge.targetUserId, "IN_BATTLE", room.id);

                    // Fetch challenge problem
                    const problemsResult = await this.problemRepo.getProblems({ limit: 10 });
                    const problem = problemsResult.problems[0] || (await this.problemRepo.getProblemById(room.id));

                    const matchPayload = {
                        roomId: room.id,
                        roomCode: room.roomCode,
                        problem: {
                            id: problem?.id || room.id,
                            title: problem?.title || "Balanced Challenge",
                            statement: problem?.statement || "Implement your algorithm to solve the challenge.",
                            difficulty: problem?.difficulty || "EASY",
                            testCases: problem?.testCases || [
                                { input: "2 7", expectedOutput: "9" },
                                { input: "3 2", expectedOutput: "5" },
                            ],
                            starterCode: {
                                javascript: "function solution(a, b) {\n  // Write your code here\n  return a + b;\n}",
                                cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n  int a, b;\n  if (cin >> a >> b) cout << (a + b) << endl;\n  return 0;\n}",
                            },
                        },
                        players: [challenge.fromUsername, challenge.targetUsername],
                    };

                    // Join both sockets to room and dispatch match
                    const challengerSocket = this.connectionManager.userSockets.get(challenge.fromUserId);
                    const targetSocket = this.connectionManager.userSockets.get(challenge.targetUserId);

                    if (challengerSocket) {
                        this.connectionManager.joinRoom(room.id, challengerSocket);
                        const s = this.socketUsers.get(challengerSocket);
                        if (s) s.roomId = room.id;
                    }
                    if (targetSocket) {
                        this.connectionManager.joinRoom(room.id, targetSocket);
                        const s = this.socketUsers.get(targetSocket);
                        if (s) s.roomId = room.id;
                    }

                    this.connectionManager.sendToUser(challenge.fromUserId, "match_found", matchPayload);
                    this.connectionManager.sendToUser(challenge.targetUserId, "match_found", matchPayload);
                    break;
                }

                // 5. Decline Direct Challenge
                case "decline_challenge": {
                    const { challengeId } = data;
                    const challenge = this.connectionManager.getChallenge(challengeId);
                    if (challenge) {
                        challenge.status = "DECLINED";
                        this.connectionManager.removeChallenge(challengeId);
                        this.connectionManager.sendToUser(challenge.fromUserId, "challenge_declined", {
                            challengeId,
                            targetUsername: challenge.targetUsername,
                        });
                    }
                    break;
                }

                // 6. Cancel Direct Challenge (By Challenger)
                case "cancel_challenge": {
                    const { challengeId } = data;
                    const challenge = this.connectionManager.getChallenge(challengeId);
                    if (challenge) {
                        challenge.status = "CANCELLED";
                        this.connectionManager.removeChallenge(challengeId);
                        this.connectionManager.sendToUser(challenge.targetUserId, "challenge_cancelled", {
                            challengeId,
                        });
                    }
                    break;
                }

                // 7. Find Match (1v1 Queue + Auto-Bot Fallback)
                case "find_match": {
                    const session = this.socketUsers.get(socket);
                    const identifier = session?.userId || currentUserId.value || data.username || "Player";

                    let user = await this.userRepo.getUserById(identifier);
                    if (!user) {
                        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                        const fallbackName = data.username || `Player_${randomSuffix}`;
                        user = await this.userRepo.upsertUser({
                            username: fallbackName,
                            email: `${fallbackName.toLowerCase().replace(/\s+/g, "_")}@algofight.local`,
                        });
                    }

                    let activeUserId = user.id;
                    let activeUsername = user.username;
                    if (this.matchmakingService.isQueued(user.id)) {
                        const guestSuffix = Math.floor(1000 + Math.random() * 9000);
                        const secondUser = await this.userRepo.upsertUser({
                            username: `${user.username}_${guestSuffix}`,
                            email: `${user.username.toLowerCase()}_${guestSuffix}@algofight.local`,
                        });
                        activeUserId = secondUser.id;
                        activeUsername = secondUser.username;
                    }

                    currentUserId.value = activeUserId;
                    this.connectionManager.registerUser(activeUserId, socket, {
                        username: activeUsername,
                        rating: user.rating,
                        platformCode: user.platformCode || undefined,
                        status: "IN_BATTLE",
                    });
                    this.socketUsers.set(socket, {
                        userId: activeUserId,
                        username: activeUsername,
                        rating: user.rating,
                        platformCode: user.platformCode || undefined,
                    });

                    const match = await this.matchmakingService.joinQueue(activeUserId);

                    if (match) {
                        this.connectionManager.updatePresenceStatus(activeUserId, "IN_BATTLE", match.roomId);
                        await this.dispatchMatch(match, activeUsername, socket);
                    } else {
                        this.send(socket, "waiting_for_opponent", { status: "queued" });

                        // If solo testing, auto-match with a bot in 2 seconds
                        setTimeout(async () => {
                            if (this.matchmakingService.isQueued(activeUserId)) {
                                this.matchmakingService.cancelQueue(activeUserId);

                                const botRoom = await this.battleRoomService.createRoom({
                                    hostId: activeUserId,
                                    maxPlayers: 2,
                                    timeLimitMinutes: 15,
                                });

                                const botMatch = {
                                    roomId: botRoom.id,
                                    roomCode: botRoom.roomCode,
                                    player1Id: activeUserId,
                                    player2Id: "bot",
                                };

                                this.connectionManager.updatePresenceStatus(activeUserId, "IN_BATTLE", botRoom.id);
                                await this.dispatchMatch(botMatch, activeUsername, socket, "AlgoBot (1200)");
                            }
                        }, 2000);
                    }
                    break;
                }

                // 8. Test Code (Runs Sample Tests)
                case "test_code": {
                    const { code, language } = data;

                    const result = await this.mockExecutor.execute({
                        submissionId: `test-${Date.now()}`,
                        language: language || "javascript",
                        code: code || "",
                        testCases: [
                            { input: "2 7", expectedOutput: "9" },
                            { input: "3 2", expectedOutput: "5" },
                        ],
                        timeLimit: 2000,
                        memoryLimit: 256,
                    });

                    this.send(socket, "code_result", {
                        result: {
                            passed: result.failedCount === 0,
                            passedTestCases: result.passedCount,
                            totalTestCases: result.passedCount + result.failedCount,
                            output: result.stdout || (result.failedCount === 0 ? "Sample test cases passed!" : result.stderr || "Output mismatch."),
                            executionTime: result.executionTime,
                        },
                    });
                    break;
                }

                // 9. Submit Code (Evaluates & Concludes Match)
                case "submit_code": {
                    const { code, language, roomId } = data;
                    const session = this.socketUsers.get(socket);
                    const username = session?.username || "Player";
                    const submissionId = `submit-${Date.now()}`;

                    const result = await this.mockExecutor.execute({
                        submissionId,
                        language: language || "javascript",
                        code: code || "",
                        testCases: [
                            { input: "2 7", expectedOutput: "9" },
                            { input: "3 2", expectedOutput: "5" },
                            { input: "100 250", expectedOutput: "350" },
                        ],
                        timeLimit: 2000,
                        memoryLimit: 256,
                    });

                    const isAccepted = result.failedCount === 0;

                    this.send(socket, "code_result", {
                        result: {
                            passed: isAccepted,
                            passedTestCases: result.passedCount,
                            totalTestCases: result.passedCount + result.failedCount,
                            output: result.stdout || (isAccepted ? "All test cases passed!" : "Wrong Answer on testcase."),
                            executionTime: result.executionTime,
                        },
                    });

                    // Ingest submission telemetry to Linux Server Dashboard
                    logger.info(
                        {
                            submissionId,
                            userId: session?.userId || "guest",
                            roomId: roomId || undefined,
                            language: language || "javascript",
                            executionTimeMs: result.executionTime || 20,
                            cpuTimeMs: (result.executionTime || 20) * 0.95,
                            peakMemoryKb: 14500,
                            verdict: isAccepted ? "ACCEPTED" : "WRONG_ANSWER",
                            passCount: result.passedCount,
                            totalTestcases: result.passedCount + result.failedCount,
                        },
                        "Submission code evaluated via WebSocket",
                    );

                    if (isAccepted && roomId) {
                        if (session?.userId) {
                            await this.battleRoomRepo.recordParticipantScore(roomId, session.userId, 100, true).catch(() => { });
                            this.connectionManager.updatePresenceStatus(session.userId, "AVAILABLE");
                        }
                        await this.battleRoomService.finishBattle(roomId).catch(() => { });

                        this.connectionManager.broadcastToRoom(roomId, "battle_over", {
                            winner: username,
                        });

                        // ✅ Sync Battle Telemetry (supports 1v1, Solo Bot, FFA Multiplayer)
                        const room = await this.battleRoomRepo.getRoomById(roomId).catch(() => null);
                        const participants = (room?.participants || []).map((p, idx) => ({
                            userId: p.userId,
                            username: p.userId === session?.userId ? (username || p.userId) : `Player ${idx + 1}`,
                            language: language || "javascript",
                            score: p.score || (p.userId === session?.userId ? 100 : 0),
                            rank: p.rank || (p.userId === session?.userId ? 1 : idx + 1),
                            verdict: (p.solvedAt || p.userId === session?.userId || p.score > 0) ? "ACCEPTED" : "WRONG_ANSWER",
                            executionTimeMs: result.executionTime || 22,
                            peakMemoryKb: 14500,
                            testsPassed: p.userId === session?.userId ? (result.passedCount || 3) : 0,
                            testsTotal: (result.passedCount + result.failedCount) || 3,
                        }));


                        syncBattleToTelemetry({
                            roomId,
                            battleType: participants.length <= 2 ? "1v1" : "FFA_MULTIPLAYER",
                            problemId: room?.problemId || "prob-1",
                            problemTitle: "Live Battle Duel",
                            durationSeconds: 15,
                            winnerId: session?.userId,
                            participants: participants.length > 0 ? participants : [
                                {
                                    userId: session?.userId || "user-1",
                                    username: username || "Player 1",
                                    language: language || "javascript",
                                    score: 100,
                                    rank: 1,
                                    verdict: "ACCEPTED",
                                    executionTimeMs: result.executionTime || 22,
                                    peakMemoryKb: 14500,
                                    testsPassed: 3,
                                    testsTotal: 3,
                                },
                            ],
                        });
                    }
                    break;
                }

                // 10. Custom Room Lobby Channels
                case "join_room_channel": {
                    const { roomCode, userId, username } = data;
                    if (roomCode) {
                        this.connectionManager.joinRoom(roomCode, socket);
                        const session = this.socketUsers.get(socket) || {
                            userId: userId || currentUserId.value || "guest",
                            username: username || "Player",
                            roomId: roomCode,
                        };
                        session.roomId = roomCode;
                        this.socketUsers.set(socket, session);

                        if (session.userId) {
                            this.connectionManager.updatePresenceStatus(session.userId, "IN_LOBBY", roomCode);
                        }

                        this.connectionManager.broadcastToRoom(roomCode, "player_joined", {
                            userId: session.userId,
                            username: session.username,
                        });
                    }
                    break;
                }

                case "toggle_ready": {
                    const { roomCode, userId, isReady } = data;
                    if (roomCode) {
                        this.connectionManager.broadcastToRoom(roomCode, "player_ready_changed", {
                            userId,
                            isReady,
                        });
                    }
                    break;
                }

                case "start_room_battle": {
                    const { roomCode } = data;
                    if (roomCode) {
                        const problemsResult = await this.problemRepo.getProblems({ limit: 10 });
                        const problem = problemsResult.problems[0] || (await this.problemRepo.getProblemById(roomCode));
                        const matchPayload = {
                            roomId: roomCode,
                            roomCode: roomCode,
                            problem: {
                                id: problem?.id || roomCode,
                                title: problem?.title || "Balanced Challenge",
                                statement: problem?.statement || "Implement your algorithm to satisfy all edge and sample cases.",
                                difficulty: problem?.difficulty || "MEDIUM",
                                testCases: problem?.testCases || [],
                                starterCode: {
                                    javascript: "function solution(input) {\n  // Write your code here\n  return input;\n}",
                                    cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  // Write your code here\n  return 0;\n}",
                                },
                            },
                        };
                        this.connectionManager.broadcastToRoom(roomCode, "battle_started", matchPayload);
                    }
                    break;
                }

                default:
                    logger.debug({ action }, "Received unhandled socket action");
            }
        } catch (error) {
            logger.error({ error }, "Error processing socket message");
            this.send(socket, "error", "Invalid message format");
        }
    }

    private async dispatchMatch(
        match: { roomId: string; roomCode: string; player1Id: string; player2Id: string },
        currentUsername: string,
        currentSocket: WebSocket,
        opponentName?: string,
    ): Promise<void> {
        const problemsResult = await this.problemRepo.getProblems({ limit: 10 });
        const problem = problemsResult.problems[0] || (await this.problemRepo.getProblemById(match.roomId));

        this.connectionManager.joinRoom(match.roomId, currentSocket);
        const player1Socket = this.connectionManager.userSockets.get(match.player1Id);
        if (player1Socket && player1Socket !== currentSocket) {
            this.connectionManager.joinRoom(match.roomId, player1Socket);
        }

        const session = this.socketUsers.get(currentSocket);
        if (session) {
            session.roomId = match.roomId;
        }

        const opp = opponentName || "Opponent";

        const matchPayload = {
            roomId: match.roomId,
            roomCode: match.roomCode,
            problem: {
                id: problem?.id || match.roomId,
                title: problem?.title || "Two Sum",
                statement: problem?.statement || "Given two space-separated integers, output their sum.",
                difficulty: problem?.difficulty || "EASY",
                testCases: problem?.testCases || [
                    { input: "2 7", expectedOutput: "9" },
                    { input: "3 2", expectedOutput: "5" },
                ],
                starterCode: {
                    javascript: "function solution(a, b) {\n  // Write your code here\n  return a + b;\n}",
                    cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n  int a, b;\n  if (cin >> a >> b) cout << (a + b) << endl;\n  return 0;\n}",
                },
            },
            players: [currentUsername, opp],
        };

        this.connectionManager.broadcastToRoom(match.roomId, "match_found", matchPayload);
    }

    handleDisconnect(socket: WebSocket): void {
        const session = this.socketUsers.get(socket);
        if (session?.roomId) {
            this.connectionManager.broadcastToRoom(session.roomId, "opponent_disconnected", {
                username: session.username,
            });
        }
        if (session?.userId) {
            this.connectionManager.unregisterUser(session.userId, socket);
        }
        this.socketUsers.delete(socket);
    }

    private send(socket: WebSocket, event: string, payload: any): void {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ event, ...payload }));
        }
    }
}
