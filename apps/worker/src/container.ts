import { ExecutionService } from "@algofight/application";
import { PrismaSubmissionRepository } from "@algofight/database";

const submissionRepository = new PrismaSubmissionRepository();

export const executionService = new ExecutionService(
    submissionRepository,
);