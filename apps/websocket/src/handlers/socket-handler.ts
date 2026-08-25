// apps/websocket/src/handlers/socket-handler.ts
import { WebSocket } from "ws";
import { syncBattleToTelemetry } from "../events/battle.events";
import { ConnectionManager } from "../server/connection-manager";
import { logger } from "@algofight/logger";
import Redis from "ioredis";
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
    BattleService,
    EvaluationService,
} from "@algofight/application";
import { battleTimerQueue, JOB_NAMES } from "@algofight/queue";

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
    private readonly evaluationService = new EvaluationService();
    private readonly battleService = new BattleService(this.battleRoomRepo, this.battleRoomService);
    private readonly matchmakingService = new MatchmakingService(
        this.userRepo,
        this.battleRoomService,
        this.problemRepo,
    );
    private readonly mockExecutor = new MockExecutor();
    private readonly redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

    // Map socket -> user session
    private readonly socketUsers = new Map<WebSocket, {
        userId: string;
        username: string;
        rating?: number;
        platformCode?: string;
        roomId?: string;
    }>();
    private readonly disconnectTimeouts = new Map<string, NodeJS.Timeout>();

    constructor(private readonly connectionManager: ConnectionManager) { }

    private formatTime(seconds: number) {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    }

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
                case "auth":
                case "identify": {
                    const userId = data.userId || data.uid;
                    const username = data.username || "Player";
                    if (userId) {
                        currentUserId.value = userId;

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

                        const presence = this.connectionManager.getPresence(userId);
                        if (presence) {
                            this.connectionManager.broadcastToAll("player_presence_update", presence);
                        }

                        const onlineList = this.connectionManager.getAllOnlinePresences();
                        this.send(socket, "presence_sync", { onlinePlayers: onlineList });
                    }
                    break;
                }

                case "get_available_players":
                case "subscribe_presence": {
                    const onlineList = this.connectionManager.getAllOnlinePresences();
                    this.send(socket, "presence_sync", { onlinePlayers: onlineList });
                    break;
                }

                case "send_challenge": {
                    const { targetUserId, targetUsername, fromUserId: rawFromUserId, fromUsername: rawFromUsername } = data;
                    let session = this.socketUsers.get(socket);

                    let fromUserId = session?.userId || rawFromUserId || currentUserId.value;
                    let fromUsername = session?.username || rawFromUsername || "Challenger";

                    if (!fromUserId) {
                        fromUserId = `user_${Math.floor(1000 + Math.random() * 9000)}`;
                        currentUserId.value = fromUserId;
                    }

                    if (!session || !session.userId) {
                        this.connectionManager.registerUser(fromUserId, socket, { username: fromUsername });
                        this.socketUsers.set(socket, { userId: fromUserId, username: fromUsername, rating: 1200 });
                        session = this.socketUsers.get(socket);
                    }

                    const fromRating = session?.rating || 1200;

                    if (!targetUserId) {
                        this.send(socket, "error", "Invalid target player for duel challenge.");
                        break;
                    }

                    if (!this.connectionManager.isUserOnline(targetUserId)) {
                        this.send(socket, "challenge_target_offline", {
                            targetUserId,
                            targetUsername: targetUsername || "Player",
                            message: `${targetUsername || "Player"} is currently offline. Would you like to battle AlgoBot (1200) instead?`
                        });
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
                        this.send(socket, "challenge_target_offline", {
                            targetUserId,
                            targetUsername: targetUsername || "Player",
                            message: `${targetUsername || "Player"} is currently offline. Would you like to battle AlgoBot (1200) instead?`
                        });
                        break;
                    }

                    this.connectionManager.sendToUser(targetUserId, "challenge_received", challenge);
                    this.send(socket, "challenge_sent", challenge);

                    // Push persistent Redis inbox notification
                    await this.pushInboxNotification({
                        userId: targetUserId,
                        type: "CHALLENGE",
                        title: "⚔️ 1v1 Battle Invite",
                        message: `${fromUsername} challenged you to an instant 1v1 battle duel!`,
                        metadata: {
                            challengeId: challenge.challengeId,
                            fromUserId,
                            fromUsername,
                            fromRating,
                        },
                    });
                    break;
                }

                case "start_bot_battle": {
                    let session = this.socketUsers.get(socket);
                    let activeUserId = session?.userId || currentUserId.value || data.fromUserId;
                    let activeUsername = session?.username || data.fromUsername || "Player";

                    if (!activeUserId) {
                        activeUserId = `user_${Date.now()}`;
                        currentUserId.value = activeUserId;
                    }

                    if (!session) {
                        this.connectionManager.registerUser(activeUserId, socket, { username: activeUsername });
                        this.socketUsers.set(socket, { userId: activeUserId, username: activeUsername, rating: 1200 });
                    }

                    try {
                        await this.userRepo.upsertUser({
                            id: "bot",
                            username: "AlgoBot",
                            email: "bot@algofight.local",
                            userType: "INDIVIDUAL",
                        });

                        const botRoom = await this.battleRoomService.createRoom({
                            hostId: activeUserId,
                            maxPlayers: 2,
                            timeLimitMinutes: 15,
                            difficulty: "MIX",
                            questionCount: 3
                        });

                        await this.battleRoomService.joinRoom(botRoom.id, "bot");
                        await this.battleRoomService.setPlayerReady(botRoom.id, activeUserId, true);
                        await this.battleRoomService.setPlayerReady(botRoom.id, "bot", true);

                        const botMatch = {
                            roomId: botRoom.id,
                            roomCode: botRoom.roomCode,
                            player1Id: activeUserId,
                            player2Id: "bot",
                        };

                        this.connectionManager.updatePresenceStatus(activeUserId, "IN_BATTLE", botRoom.id);
                        await this.dispatchMatch(botMatch, activeUsername, socket, "AlgoBot (1200)");
                    } catch (err: any) {
                        logger.error({ err, userId: activeUserId }, "Failed to start bot battle");
                        this.send(socket, "error", "Failed to start bot battle");
                    }
                    break;
                }

                case "accept_challenge": {
                    const { challengeId } = data;
                    const challenge = this.connectionManager.getChallenge(challengeId);

                    if (!challenge || challenge.status !== "PENDING") {
                        this.send(socket, "error", "Challenge expired or no longer available.");
                        break;
                    }

                    challenge.status = "ACCEPTED";
                    this.connectionManager.removeChallenge(challengeId);

                    try {
                        const room = await this.battleRoomService.createRoom({
                            hostId: challenge.fromUserId,
                            maxPlayers: 2,
                            timeLimitMinutes: 15,
                            difficulty: "MIX",
                            questionCount: 3
                        });

                        await this.battleRoomService.joinRoom(room.id, challenge.targetUserId);
                        await this.battleRoomService.setPlayerReady(room.id, challenge.fromUserId, true);
                        await this.battleRoomService.setPlayerReady(room.id, challenge.targetUserId, true);

                        await this.battleRoomService.startBattle(room.id, challenge.fromUserId);
                        const roomWithProblems = await this.battleRoomRepo.getRoomById(room.id);
                        const problems = roomWithProblems?.problems || [];

                        this.connectionManager.updatePresenceStatus(challenge.fromUserId, "IN_BATTLE", room.id);
                        this.connectionManager.updatePresenceStatus(challenge.targetUserId, "IN_BATTLE", room.id);

                        const matchPayload = {
                            roomId: room.id,
                            roomCode: room.roomCode,
                            problems: problems,
                            timeLimitSeconds: room.timeLimitMinutes * 60,
                            players: [challenge.fromUsername, challenge.targetUsername],
                        };

                        const battleState = {
                            roomId: room.id,
                            status: "RUNNING",
                            timeLimitSeconds: room.timeLimitMinutes * 60,
                            startTime: Date.now(),
                            totalQuestions: problems.length,
                            players: [
                                { userId: challenge.fromUserId, username: challenge.fromUsername, points: 0, solvedProblems: [], solvedCount: 0 },
                                { userId: challenge.targetUserId, username: challenge.targetUsername, points: 0, solvedProblems: [], solvedCount: 0 }
                            ]
                        };
                        await this.redis.set(`battle_state:${room.id}`, JSON.stringify(battleState), "EX", (room.timeLimitMinutes * 60) + 300);
                        await battleTimerQueue.add(JOB_NAMES.BATTLE_TIMER, { roomId: room.id }, { delay: (room.timeLimitMinutes * 60) * 1000 });

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
                        this.connectionManager.broadcastToRoom(room.id, "battle_state_sync", battleState);

                        await this.pushInboxNotification({
                            userId: challenge.fromUserId,
                            type: "CHALLENGE_ACCEPTED",
                            title: "⚔️ Challenge Accepted!",
                            message: `${challenge.targetUsername} accepted your battle challenge!`,
                            metadata: { roomId: room.id },
                        });
                    } catch (err) {
                        this.send(socket, "error", "Failed to accept challenge or start battle.");
                    }
                    break;
                }

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

                        await this.pushInboxNotification({
                            userId: challenge.fromUserId,
                            type: "CHALLENGE_DECLINED",
                            title: "⚔️ Challenge Declined",
                            message: `${challenge.targetUsername} declined your battle challenge.`,
                            metadata: { challengeId },
                        });
                    }
                    break;
                }

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

                        setTimeout(async () => {
                            try {
                                if (this.matchmakingService.isQueued(activeUserId)) {
                                    this.matchmakingService.cancelQueue(activeUserId);

                                    await this.userRepo.upsertUser({
                                        id: "bot",
                                        username: "AlgoBot",
                                        email: "bot@algofight.local",
                                        userType: "INDIVIDUAL",
                                    });

                                    const botRoom = await this.battleRoomService.createRoom({
                                        hostId: activeUserId,
                                        maxPlayers: 2,
                                        timeLimitMinutes: 15,
                                        difficulty: "MIX",
                                        questionCount: 3
                                    });

                                    await this.battleRoomService.joinRoom(botRoom.id, "bot");
                                    await this.battleRoomService.setPlayerReady(botRoom.id, activeUserId, true);
                                    await this.battleRoomService.setPlayerReady(botRoom.id, "bot", true);

                                    const botMatch = {
                                        roomId: botRoom.id,
                                        roomCode: botRoom.roomCode,
                                        player1Id: activeUserId,
                                        player2Id: "bot",
                                    };

                                    this.connectionManager.updatePresenceStatus(activeUserId, "IN_BATTLE", botRoom.id);
                                    await this.dispatchMatch(botMatch, activeUsername, socket, "AlgoBot (1200)");
                                }
                            } catch (err: any) {
                                logger.error({ err, userId: activeUserId }, "Failed to dispatch bot match");
                                this.send(socket, "error", "Matchmaking error occurred");
                            }
                        }, 2000);
                    }
                    break;
                }

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

                case "submit_code": {
                    // Handled securely by REST API + background execution service now!
                    break;
                }

                case "join_room_channel": {
                    const { roomCode, userId, username } = data;
                    if (roomCode) {
                        const actualUserId = userId || currentUserId.value || "guest";
                        
                        if (this.disconnectTimeouts.has(actualUserId)) {
                            clearTimeout(this.disconnectTimeouts.get(actualUserId));
                            this.disconnectTimeouts.delete(actualUserId);
                            
                            this.connectionManager.broadcastToRoom(roomCode, "opponent_reconnected", {
                                userId: actualUserId,
                                username: username || "Player",
                            });
                        }

                        this.connectionManager.joinRoom(roomCode, socket);
                        const session = this.socketUsers.get(socket) || {
                            userId: actualUserId,
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
                        const room = await this.battleRoomRepo.getRoomByCode(roomCode);
                        if (room) {
                            try {
                                await this.battleRoomService.startBattle(room.id, room.hostId);
                            } catch (err: any) {
                                logger.error({ err, roomCode }, "Failed to start room battle");
                                this.send(socket, "error", err.message || "Cannot start battle");
                                break;
                            }
                            const roomWithProblems = await this.battleRoomRepo.getRoomById(room.id);
                            const problems = roomWithProblems?.problems || [];

                            const matchPayload = {
                                roomId: room.id,
                                roomCode: room.roomCode,
                                problems: problems,
                                timeLimitSeconds: room.timeLimitMinutes * 60,
                            };

                            const battleState = {
                                roomId: room.id,
                                status: "RUNNING",
                                timeLimitSeconds: room.timeLimitMinutes * 60,
                                startTime: Date.now(),
                                totalQuestions: problems.length,
                                players: room.participants.map(p => ({
                                    userId: p.userId,
                                    username: p.userId,
                                    points: 0,
                                    solvedProblems: [],
                                    solvedCount: 0
                                }))
                            };

                            await this.redis.set(`battle_state:${room.id}`, JSON.stringify(battleState), "EX", (room.timeLimitMinutes * 60) + 300);
                            await battleTimerQueue.add(JOB_NAMES.BATTLE_TIMER, { roomId: room.id }, { delay: (room.timeLimitMinutes * 60) * 1000 });
                            this.connectionManager.broadcastToRoom(roomCode, "battle_started", matchPayload);
                            this.connectionManager.broadcastToRoom(roomCode, "battle_state_sync", battleState);
                        }
                    }
                    break;
                }

                case "test_code": {
                    const { code, language, problemId } = data;
                    const session = this.socketUsers.get(socket);
                    const userId = session?.userId;
                    
                    if (!problemId || !code) {
                        this.send(socket, "error", "Missing problemId or code");
                        break;
                    }

                    const problem = await this.problemRepo.getProblemById(problemId);
                    if (!problem) {
                        this.send(socket, "error", "Problem not found");
                        break;
                    }

                    const result = await this.evaluationService.evaluateSubmission({
                        submissionId: "test-" + Date.now(),
                        language,
                        code,
                        testCases: problem.testCases,
                        timeLimitMs: problem.timeLimit,
                        memoryLimitBytes: problem.memoryLimit,
                    });

                    this.send(socket, "code_result", {
                        action: "test_result",
                        success: result.verdict === "ACCEPTED",
                        results: (result.testCases || []).map((tc) => ({
                            input: problem.testCases.find(p => p.id === tc.testCaseId)?.input || "",
                            expected: problem.testCases.find(p => p.id === tc.testCaseId)?.expectedOutput || "",
                            actual: tc.actualOutput,
                            passed: tc.passed,
                            error: tc.error,
                        })),
                    });
                    break;
                }

                case "submit_code": {
                    const { code, language, roomId, problemId } = data;
                    const session = this.socketUsers.get(socket);
                    const userId = session?.userId;
                    
                    if (!problemId || !code) {
                        this.send(socket, "error", "Missing problemId or code");
                        break;
                    }

                    const problem = await this.problemRepo.getProblemWithAllTestCases(problemId);
                    if (!problem) {
                        this.send(socket, "error", "Problem not found");
                        break;
                    }

                    const result = await this.evaluationService.evaluateSubmission({
                        submissionId: "submit-" + Date.now(),
                        language,
                        code,
                        testCases: problem.testCases,
                        timeLimitMs: problem.timeLimit,
                        memoryLimitBytes: problem.memoryLimit,
                    });

                    const isAccepted = result.verdict === "ACCEPTED";
                    
                    this.send(socket, "code_result", {
                        action: "submit_result",
                        success: isAccepted,
                        results: (result.testCases || []).map((tc) => ({
                            passed: tc.passed,
                            error: tc.error,
                        })),
                    });

                    if (isAccepted && roomId && userId) {
                        await this.battleService.processEvaluationResult(roomId, userId, problemId, true, 100);
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
        await this.battleRoomService.startBattle(match.roomId, match.player1Id);
        const roomWithProblems = await this.battleRoomRepo.getRoomById(match.roomId);
        const problems = roomWithProblems?.problems || [];

        this.connectionManager.joinRoom(match.roomId, currentSocket);
        const player1Socket = this.connectionManager.userSockets.get(match.player1Id);
        if (player1Socket && player1Socket !== currentSocket) {
            this.connectionManager.joinRoom(match.roomId, player1Socket);
        }

        const session = this.socketUsers.get(currentSocket);
        if (session) {
            session.roomId = match.roomId;
        }

        let oppName = opponentName;
        if (!oppName && match.player2Id) {
            const oppUser = await this.userRepo.getUserById(match.player2Id);
            oppName = oppUser?.username;
        }
        const opp = oppName || "Opponent";
        const timeLimitSeconds = (roomWithProblems?.timeLimitMinutes || 15) * 60;

        const matchPayload = {
            roomId: match.roomId,
            roomCode: match.roomCode,
            problems: problems,
            timeLimitSeconds,
            players: [currentUsername, opp],
        };

        const battleState = {
            roomId: match.roomId,
            status: "RUNNING",
            timeLimitSeconds,
            startTime: Date.now(),
            totalQuestions: problems.length,
            players: [
                { userId: match.player1Id, username: currentUsername, points: 0, solvedProblems: [], solvedCount: 0 },
                { userId: match.player2Id, username: opp, points: 0, solvedProblems: [], solvedCount: 0 }
            ]
        };
        await this.redis.set(`battle_state:${match.roomId}`, JSON.stringify(battleState), "EX", timeLimitSeconds + 300);
        await battleTimerQueue.add(JOB_NAMES.BATTLE_TIMER, { roomId: match.roomId }, { delay: timeLimitSeconds * 1000 });

        this.connectionManager.broadcastToRoom(match.roomId, "match_found", matchPayload);
        this.connectionManager.broadcastToRoom(match.roomId, "battle_state_sync", battleState);
    }

    async handleDisconnect(socket: WebSocket): Promise<void> {
        const session = this.socketUsers.get(socket);
        if (session?.roomId && session?.userId) {
            const rawState = await this.redis.get(`battle_state:${session.roomId}`);
            if (rawState) {
                const state = JSON.parse(rawState);
                if (state.status === "RUNNING") {
                    const opponent = state.players.find((p: any) => p.userId !== session.userId);

                    this.connectionManager.broadcastToRoom(session.roomId, "opponent_disconnected", {
                        userId: session.userId,
                        username: session.username,
                        reconnectDeadline: Date.now() + 60000
                    });

                    const timeout = setTimeout(async () => {
                        this.disconnectTimeouts.delete(session.userId!);
                        
                        const currentStateRaw = await this.redis.get(`battle_state:${session.roomId}`);
                        if (currentStateRaw) {
                            const currentState = JSON.parse(currentStateRaw);
                            if (currentState.status === "RUNNING") {
                                await this.battleService.finishBattle(session.roomId!, "OPPONENT_FORFEIT", opponent?.userId, session.userId);
                            }
                        }
                    }, 60000);
                    
                    this.disconnectTimeouts.set(session.userId, timeout);
                }
            }
            this.connectionManager.leaveRoom(session.roomId, socket);
        }

        if (session?.userId) {
            this.connectionManager.unregisterUser(session.userId, socket);
        }
        this.socketUsers.delete(socket);
    }

    private async pushInboxNotification(params: {
        userId: string;
        type: "CHALLENGE" | "CHALLENGE_ACCEPTED" | "CHALLENGE_DECLINED" | "BATTLE_START" | "BATTLE_RESULT" | "SYSTEM";
        title: string;
        message: string;
        metadata?: Record<string, any>;
    }) {
        try {
            const notification = {
                id: `notif_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
                userId: params.userId,
                type: params.type,
                title: params.title,
                message: params.message,
                read: false,
                createdAt: Date.now(),
                metadata: params.metadata || {},
            };
            const key = `user:notifications:${params.userId}`;
            await this.redis.lpush(key, JSON.stringify(notification));
            await this.redis.ltrim(key, 0, 49);

            // Broadcast live inbox update event to user if online
            this.connectionManager.sendToUser(params.userId, "inbox_notification", notification);
        } catch (err) {
            logger.error({ err, userId: params.userId }, "Failed to push persistent inbox notification");
        }
    }

    private send(socket: WebSocket, event: string, payload: any): void {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ event, ...payload }));
        }
    }
}
