import { FastifyInstance } from "fastify";

import {
    PrismaProblemRepository,
} from "@algofight/database";

import {
    ProblemController,
} from "../controllers/problem.controller";

import {
    problemSchema,
    ProblemInput,
} from "../schema/problem.schema";

const repository =
    new PrismaProblemRepository();

const controller =
    new ProblemController(
        repository,
    );

export async function problemRoutes(
    app: FastifyInstance,
) {
    app.post(
        "/problems",
        async (request) => {
            const body: ProblemInput =
                problemSchema.parse(
                    request.body,
                );

            return controller
                .createProblem(body);
        },
    );

    app.get(
        "/problems/:id",
        async (request) => {
            const { id } =
                request.params as {
                    id: string;
                };

            return controller
                .getProblemById(id);
        },
    );
}