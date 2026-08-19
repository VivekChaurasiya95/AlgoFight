// apps/api/src/routes/problem.route.ts
import { FastifyInstance } from "fastify";
import { PrismaProblemRepository } from "@algofight/database";
import { ProblemController } from "../controllers/problem.controller";
import { problemSchema, ProblemInput } from "../schema/problem.schema";

const repository = new PrismaProblemRepository();
const controller = new ProblemController(repository);

export async function problemRoutes(app: FastifyInstance) {
    // 1. Create Problem
    app.post("/problems", async (request) => {
        const body: ProblemInput = problemSchema.parse(request.body);
        return controller.createProblem(body);
    });

    // 2. Categories List
    app.get("/problems/categories", async () => {
        return [
            "Arrays & Hashing",
            "Two Pointers",
            "Sliding Window",
            "Stack & Queues",
            "Binary Search",
            "Linked Lists",
            "Trees",
            "Dynamic Programming",
            "Graphs",
            "Greedy",
            "Math"
        ];
    });

    // 3. List Paginated Problems
    app.get("/problems", async (request) => {
        const query = request.query as any;
        return controller.getProblems({
            page: query.page ? parseInt(query.page, 10) : 1,
            limit: query.limit ? parseInt(query.limit, 10) : 20,
            difficulty: query.difficulty,
            category: query.category || query.tags,
            tags: query.tags,
        });
    });

    // 4. Get Single Problem by ID
    app.get("/problems/:id", async (request) => {
        const { id } = request.params as { id: string };
        return controller.getProblemById(id);
    });

    // 5. Evaluate Practice Code (Test / Submit)
    app.post("/practice/evaluate", async (request) => {
        const body = request.body as any;
        return controller.evaluatePractice({
            problemId: body.problemId,
            code: body.code,
            language: body.language,
            mode: body.mode,
        });
    });

    // 6. Practice Progress Record
    app.post("/users/:uid/practice-progress", async (request) => {
        const body = request.body as any;
        return {
            newlySolved: Boolean(body.passed),
            progress: {
                practiceSubmissionCount: 1,
                practiceSolvedProblemIds: body.passed ? [body.problemId] : [],
            },
        };
    });
}
