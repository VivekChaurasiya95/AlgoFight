import {z} from "zod";

export const problemSchema = z.object({
    title: z.string().min(1),

    statement: z.string().min(1),

    difficulty: z.enum([
        "EASY",
        "MEDIUM",
        "HARD",
    ]),

    timeLimit: z.number().int().positive(),

    memoryLimit: z.number().int().positive(),
});

export type ProblemInput = 
     z.infer<typeof problemSchema>;