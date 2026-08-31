// d:\AlgoFight-backend-new\apps\websocket\src\events\battle.events.ts

export enum BattleEvent {
    ROOM_CREATED = "battle.room.created",
    PLAYER_JOINED = "battle.player.joined",
    PLAYER_LEFT = "battle.player.left",
    BATTLE_STARTED = "battle.started",
    BATTLE_FINISHED = "battle.finished",
}

const TELEMETRY_URL = process.env.TELEMETRY_URL || "http://localhost:8000";

// ✅ Helper to sync any battle (1v1, Multiplayer, FFA, Solo, Tournament) to the dashboard
export async function syncBattleToTelemetry(battleData: {
    roomId: string;
    battleType?: string; // "1v1" | "FFA_MULTIPLAYER" | "SOLO_AI" | "TOURNAMENT"
    problemId?: string;
    problemTitle?: string;
    durationSeconds?: number;
    winnerId?: string;
    participants: Array<{
        userId: string;
        username: string;
        language?: string;
        executionTimeMs?: number;
        cpuTimeMs?: number;
        peakMemoryKb?: number;
        score: number;
        rank?: number;
        verdict?: string;
        testsPassed?: number;
        testsTotal?: number;
    }>;
}) {
    try {
        await fetch(`${TELEMETRY_URL}/api/v1/telemetry/battle`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                battle_id: battleData.roomId,
                room_id: battleData.roomId,
                battle_type: battleData.battleType || (battleData.participants.length <= 2 ? "1v1" : "FFA_MULTIPLAYER"),
                problem_id: battleData.problemId || "algofight-problem",
                problem_title: battleData.problemTitle || "Algorithm Duel",
                status: "FINISHED",
                duration_seconds: battleData.durationSeconds || 0,
                participants: battleData.participants,
                winner_id: battleData.winnerId,
            }),
        });
    } catch {
        // Silently ignore if telemetry server is unreachable
    }
}
