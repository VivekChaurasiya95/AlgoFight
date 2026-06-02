import { z } from "zod";

export const submissionSchema = z.object(
    {
        language: z.string().min(1),

        code: z.string().min(1),
    }
);

export type SubmissionInput = 
     z.infer<typeof submissionSchema>