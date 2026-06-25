import { z } from "zod";

export const RetrySubmissionSchema = z.object({
    submissionId: z.string().uuid(),
    retryCount: z.coerce.number().int().min(0),
});

export const RecoveryJobSchema = z.object({
    workerId: z.string().uuid().optional(),
    staleAfterSeconds: z.coerce.number().int().positive(),
});

export type RetrySubmissionDto = 
    z.infer<typeof RetrySubmissionSchema>;

export type RecoveryJobDto = 
    z.infer<typeof RecoveryJobSchema>;