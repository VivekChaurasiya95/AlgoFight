// apps/websocket/src/handlers/socket-handler.ts
import { WebSocket } from "ws";
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
    private readonly socketUsers = new Map<WebSocket, { userId: string; username: string; roomId?: string }>();

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
                        this.connectionManager.registerUser(userId, socket);
                        this.socketUsers.set(socket, { userId, username });
                        this.send(socket, "authenticated", { userId, username });
                    }
                    break;
                }

                // 2. Find Match (1v1 Queue + Auto-Bot Fallback)
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

                    // If this specific user is ALREADY in the queue from another tab, create a second test player
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
                    this.connectionManager.registerUser(activeUserId, socket);
                    this.socketUsers.set(socket, { userId: activeUserId, username: activeUsername });

                    const match = await this.matchmakingService.joinQueue(activeUserId);

                    if (match) {
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

                                await this.dispatchMatch(botMatch, activeUsername, socket, "AlgoBot (1200)");
                            }
                        }, 2000);
                    }
                    break;
                }

                // 3. Test Code (Runs Sample Tests)
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

                // 4. Submit Code (Evaluates & Concludes Match)
                case "submit_code": {
                    const { code, language, roomId } = data;
                    const session = this.socketUsers.get(socket);
                    const username = session?.username || "Player";

                    const result = await this.mockExecutor.execute({
                        submissionId: `submit-${Date.now()}`,
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

                    if (isAccepted && roomId) {
                        if (session?.userId) {
                            await this.battleRoomRepo.recordParticipantScore(roomId, session.userId, 100, true).catch(() => { });
                        }
                        await this.battleRoomService.finishBattle(roomId).catch(() => { });

                        this.connectionManager.broadcastToRoom(roomId, "battle_over", {
                            winner: username,
                        });
                    }
                    break;
                }
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
                    const { roomCode, hostId } = data;
                    if (roomCode) {
                        // Fetch a problem for the custom room battle
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
        const player1Socket = (this.connectionManager as any).userSockets?.get(match.player1Id);
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
        this.socketUsers.delete(socket);
    }

    private send(socket: WebSocket, event: string, payload: any): void {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ event, ...payload }));
        }
    }
}
