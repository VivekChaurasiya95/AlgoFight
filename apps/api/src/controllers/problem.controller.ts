import {
    ProblemInput,
} from "../schema/problem.schema";

import {
    ProblemRepository,
} from "@algofight/database";

export class ProblemController {
    constructor(
        private readonly problemRepository:
           ProblemRepository,
    ){}

    async createProblem(
        body: ProblemInput,
    ){
        return this.problemRepository 
               .createProblem(body);
    }

    async getProblemById(
        problemId: string,
    ){
        return this.problemRepository
               .getProblemById(problemId);
    }
}