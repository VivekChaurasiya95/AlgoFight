import { z } from "zod";

export const submissionSchema = z.object(
    {
        userId: z.uuid(),

        problemId: z.uuid(),

        
        language: z.string().min(1),

        code: z.string().min(1),
    }
);

export type SubmissionInput = 
     z.infer<typeof submissionSchema>