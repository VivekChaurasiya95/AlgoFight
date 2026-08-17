import { z } from "zod";

export const CreateBattleRoomSchema = z.object({
    hostId: z.string().uuid(),
    maxPlayers: z.number().int().min(2).max(8).optional().default(2),
    timeLimitMinutes: z.number().int().min(1).max(60).optional().default(15),
    problemId: z.string().uuid().optional(),
});

export const JoinRoomSchema = z.object({
    userId: z.string().uuid(),
});

export const LeaveRoomSchema = z.object({
    userId: z.string().uuid(),
});

export const ReadyRoomSchema = z.object({
    userId: z.string().uuid(),
    isReady: z.boolean(),
});

export const StartBattleSchema = z.object({
    hostId: z.string().uuid(),
    problemId: z.string().uuid().optional(),
});
