import { ExecutionService } from "@algofight/application";
import { PrismaSubmissionRepository } from "@algofight/database";
import { DockerExecutor } from "@algofight/application";
const submissionRepository = new PrismaSubmissionRepository();

export const executionService = new ExecutionService(
    submissionRepository,
    new DockerExecutor()
);