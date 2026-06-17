
import { enqueueSubmissionJob } from "@algofight/queue";
import { SubmissionInput } from "../schema/submission.schema";
import { SubmissionRepository } from "@algofight/database";

export class SubmissionController{
    constructor(
    private readonly submissionRepository:
        SubmissionRepository,
) {}

    async submit (
        body: SubmissionInput,
    ){
        const submission =
          await this.submissionRepository.createSubmission({
            language: body.language,
            code: body.code
          });

        await enqueueSubmissionJob({
            submissionId: submission.id,
        });

        return submission;
    }
    async getAllSubmission(){
        return this.submissionRepository.getAllSubmission();
    }

    async getSubmissionById(
        submissionId: string,
    ){
        return this.submissionRepository.getSubmissionById(
            submissionId,
        );
    }
};