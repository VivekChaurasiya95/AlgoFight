import { FastifyInstance } from "fastify";

import {
    PrismaSubmissionRepository,
} from "@algofight/database";

import {
    enqueueSubmissionJob,
} from "@algofight/queue";

import {
    SubmissionInput,
    submissionSchema,
} from "../schema/submission.schema";

const submissionRepository =
    new PrismaSubmissionRepository();

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

            const submission =
                await submissionRepository
                    .createSubmission({
                        language:
                            body.language,

                        code:
                            body.code,
                    });

            await enqueueSubmissionJob({
                submissionId:
                    submission.id,
            });

            return submission;
        },
    );

    app.get(
        "/submissions",
        async () => {
            return submissionRepository
                .getAllSubmission();
        },
    );
}