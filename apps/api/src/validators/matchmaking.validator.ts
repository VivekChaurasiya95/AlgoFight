import { z } from "zod";

export const JoinMatchmakingSchema = z.object({
    userId: z.string().uuid(),
});

export const CancelMatchmakingSchema = z.object({
    userId: z.string().uuid(),
});