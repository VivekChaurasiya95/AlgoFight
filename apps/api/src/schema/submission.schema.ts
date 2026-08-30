import { z } from "zod";

export const submissionSchema = z.object({
    userId: z.string().uuid().optional(),
    problemId: z.string().min(1, "problemId is required."),
    roomId: z.string().optional(),
    language: z.string().min(1, "Language is required."),
    code: z.string().min(1, "Code is required.").max(65536,
        "Code exceeds maximum allowed size of 64KB"),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;

export const testRunSchema = z.object({
    language: z.string().min(1, "language is required"),
    code: z.string().min(1, "code is required").max(65536, "Code exceeds maximum allowed size of 64KB"),
    testCases: z.array(z.object({
        id: z.string(),
        input: z.string().max(32768, "Input exceeds 32KB"),
        expectedOutput: z.string().max(32768, "Expected output exceeds 32KB").default("")
    })).min(1, "At least 1 testcase is required").max(20, "Maximum 20 testcases allowed per test run"),
});

export type TestRunInput = z.infer<typeof testRunSchema>;

export const practiceEvaluateSchema = z.object({
    problemId: z.string().min(1, "problemId is required"),
    code: z.string().min(1, "code is required").max(65536, "Code exceeds maximum allowed size of 64KB"),
    language: z.string().min(1, "language is required"),
    mode: z.enum(["test", "submit"]).default("test"),
});

export type PracticeEvaluateInput = z.infer<typeof practiceEvaluateSchema>;
