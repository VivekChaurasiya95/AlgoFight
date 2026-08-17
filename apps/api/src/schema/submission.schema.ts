import { z } from "zod";

export const submissionSchema = z.object({
    userId: z.string().uuid(),
    problemId: z.string().uuid(),
    roomId: z.string().uuid().optional(),
    language: z.string().min(1),
    code: z.string().min(1),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
