import { FastifyInstance } from "fastify";
import { SubmissionController } from "../controllers/submission.controllers";

import {
    PrismaSubmissionRepository,
} from "@algofight/database";

import {
    SubmissionInput,
    submissionSchema,
} from "../schema/submission.schema";
const submissionRepository = new PrismaSubmissionRepository();
const submissionController = new SubmissionController(
    submissionRepository,
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

    app.get(
        "/submissions",
        async () => {
            return submissionController
                .getAllSubmission();
        },
    );
}