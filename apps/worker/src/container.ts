import { ExecutionService, EvaluationService } from "@algofight/application";
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
    new EvaluationService(),
    problemRepository,
    battleRoomRepository,
);


