export class SubmissionNotFoundError extends Error {
    constructor(submissionId: string){
        super(`Submission ${submissionId} was not found!.`);
        this.name = "SubmissionNotFoundError";
    };
}
