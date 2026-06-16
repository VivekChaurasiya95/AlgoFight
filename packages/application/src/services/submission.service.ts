import {
    SubmissionRepository,
    CreateSubmissionInput,
} from "@algofight/database";

import { enqueueSubmissionJob }
    from "@algofight/queue";

export class SubmissionService {
    constructor(
        private readonly submissionRepository:
            SubmissionRepository,
    ) {}

    async submit(
        input: CreateSubmissionInput,
    ) {
        const submission =
            await this.submissionRepository
                .createSubmission(
                    input,
                );

        await enqueueSubmissionJob({
            submissionId:
                submission.id,
        });

        return submission;
    }
}