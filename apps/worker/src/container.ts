import { ExecutionService, DockerExecutor } from "@algofight/application";
import {
    PrismaSubmissionRepository,
    PrismaProblemRepository,
    PrismaBattleRoomRepository,
} from "@algofight/database";

const submissionRepository = new PrismaSubmissionRepository();
const problemRepository = new PrismaProblemRepository();
const battleRoomRepository = new PrismaBattleRoomRepository();

export const executionService = new ExecutionService(
    submissionRepository,
    new DockerExecutor(),
    problemRepository,
    battleRoomRepository,
);
