import { z } from "zod";

export const CreateUserSchema = z.object({
    username: z.string().min(3).max(30),
    email: z.string().email(),
});

export const AvailablePlayersQuerySchema = z.object({
    excludeUserId: z.string().optional(),
    search: z.string().optional(),
    status: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});
