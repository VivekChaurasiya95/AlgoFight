import {z} from "zod";

export const SubmitSubmissionSchema = z.object({
    userId: z.uuid(),

    problemId: z.uuid(),

    language: z.enum([
        "javascript",
        "typescript",
        "cpp",
        "java",
        "python",
    ]),

    code: z
    .string()
    .trim()
    .min(1)
    .max(100_000)
});

export type SubmitSubmissionDto = z.infer<typeof SubmitSubmissionSchema>;