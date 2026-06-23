import { z } from "zod";

export const IdSchema = z.uuid();

export const PaginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(100).default(10),
})