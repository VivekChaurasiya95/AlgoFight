import {ProblemNotFoundError} from "@algofight/error-handling"
import { enqueueSubmissionJob } from "@algofight/queue";
import { SubmissionInput } from "../schema/submission.schema";
import { SubmissionRepository } from "@algofight/database";
import { SubmissionStatus } from "@algofight/types";
import { ProblemRepository } from "@algofight/database";
export class SubmissionController{
    constructor(
    private readonly submissionRepository:
        SubmissionRepository,

    private readonly problemRepository:
       ProblemRepository,
) {}

    async submit (
        body: SubmissionInput,
    ){
        const problem = 
          await this.problemRepository
                .getProblemById(
                    body.problemId,
                )
        if(!problem) {
            throw new ProblemNotFoundError(
                body.problemId,
            );
        }
        const submission =
          await this.submissionRepository.createSubmission({
            userId: body.userId,
            problemId: body.problemId,
            language: body.language,
            code: body.code
          });

        await enqueueSubmissionJob({
            submissionId: submission.id,
        });
        await this.submissionRepository.updateStatus(
            submission.id,
            SubmissionStatus.QUEUED
        )

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