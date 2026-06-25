import { z } from "zod";

export const WorkerRegistrationSchema = z.object({
    workerId: z.string().uuid(),
    hostname: z.string().min(1),
    concurrency: z.coerce.number().int().min(1),
});

export const WorkerHeartbeatSchema = z.object({
    workerId: z.string().uuid(),
    timestamp: z.coerce.date(),
});

export const WorkerExecutionSchema = z.object({
    submissionId: z.string().uuid,
    workerId: z.string().uuid(),
});

export type WorkerRegistrationDto = 
    z.infer<typeof WorkerRegistrationSchema>;

export type WorkerHeartbeatDto = 
    z.infer<typeof WorkerHeartbeatSchema>;

export type WorkerExecutionDto =
    z.infer<typeof WorkerExecutionSchema>;
    