import { CodeExecutor } from "../contracts/code-executor";
import { SubmissionResult } from "@algofight/database";
export class MockExecutor implements CodeExecutor{
    async execute(

        submissionId: string,
    ): Promise <SubmissionResult> {
        await new Promise((resolve) =>
            setTimeout(resolve, 3000), 
        );
        return {
        stdout: "Hello AlgoFight",
        executionTime: 3000,
        };
    }
}