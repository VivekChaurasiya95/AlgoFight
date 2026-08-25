import { z } from "zod";

export const submissionSchema = z.object({
    userId: z.string().uuid(),
    problemId: z.string().uuid(),
    roomId: z.string().uuid().optional(),
    language: z.string().min(1),
    code: z.string().min(1),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;

export const testRunSchema = z.object({
    language: z.string().min(1),
    code: z.string().min(1),
    testCases: z.array(z.object({
        id: z.string(),
        input: z.string(),
        expectedOutput: z.string().default("")
    })).min(1),
});

export type TestRunInput = z.infer<typeof testRunSchema>;
