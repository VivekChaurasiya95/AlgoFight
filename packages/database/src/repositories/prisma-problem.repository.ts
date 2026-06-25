import { PrismaClient } from "@prisma/client";

import {
    CreateProblemInput,
    ProblemRepository,
} from "../contracts/problem.repository";

import { ProblemEntity } from "../entities/problem.entity";

const prisma = new PrismaClient();

export class PrismaProblemRepository
    implements ProblemRepository
{
    async createProblem(
        input: CreateProblemInput,
    ): Promise<ProblemEntity> {
        const problem =
            await prisma.problem.create({
                data: {
                    title: input.title,
                    statement: input.statement,
                    difficulty: input.difficulty,
                    timeLimit: input.timeLimit,
                    memoryLimit: input.memoryLimit,
                },
                include: {
                    testCases: true,
                }
            });

        return problem;
    }

    async getProblemById(
        problemId: string,
    ): Promise<ProblemEntity | null> {
        return prisma.problem.findUnique({
            where: {
                id: problemId,
            },
            include: {
                testCases: true,
            }
        });
    }
}