import { FastifyInstance } from "fastify";
import { SubmissionController } from "../controllers/submission.controllers";

import {
    PrismaSubmissionRepository,
    PrismaProblemRepository
} from "@algofight/database";

import {
    SubmissionInput,
    submissionSchema,
    TestRunInput,
    testRunSchema
} from "../schema/submission.schema";
const submissionRepository = new PrismaSubmissionRepository();
const problemRepository = new PrismaProblemRepository();
const submissionController = new SubmissionController(
    submissionRepository,
    problemRepository
);

export async function submissionRoutes(
    app: FastifyInstance,
) {
    app.post(
        "/submit",
        async (request) => {
            const body: SubmissionInput =
                submissionSchema.parse(
                    request.body,
                );

            return submissionController.submit(
                body,
            )
        },
    );

    app.post(
        "/test",
        async (request) => {
            const body: TestRunInput =
                testRunSchema.parse(
                    request.body,
                );

            return submissionController.test(
                body,
            )
        },
    );

    app.get(
        "/submissions",
        async () => {
            return submissionController
                .getAllSubmission();
        },
    );
}