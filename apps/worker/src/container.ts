import { ExecutionService, DockerExecutor } from "@algofight/application";
import {
    PrismaSubmissionRepository,
    PrismaProblemRepository,
} from "@algofight/database";

const submissionRepository = new PrismaSubmissionRepository();
const problemRepository = new PrismaProblemRepository();

export const executionService = new ExecutionService(
    submissionRepository,
    new DockerExecutor(),
    problemRepository
);
