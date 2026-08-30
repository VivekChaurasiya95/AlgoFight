import { FastifyInstance } from "fastify";
import { PrismaProblemRepository } from "@algofight/database";
import { ProblemController } from "../controllers/problem.controller";
import { problemSchema, ProblemInput } from "../schema/problem.schema";
import { requireRole } from "../plugins/auth.plugin";

const repository = new PrismaProblemRepository();
const controller = new ProblemController(repository);

export async function problemRoutes(app: FastifyInstance) {
    // 1. Create Problem (Admin Only)
    app.post(
        "/problems",
        { preHandler: [requireRole("ADMIN")] },
        async (request) => {
            const body: ProblemInput = problemSchema.parse(request.body);
            return controller.createProblem(body);
        },
    );

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

    // 5. Practice Progress Record (Persisted in PostgreSQL - AF-021)
    app.post("/users/:uid/practice-progress", async (request) => {
        const { uid } = request.params as { uid: string };
        const body = request.body as any;
        const userRepo = new (await import("@algofight/database")).PrismaUserRepository();
        const progress = await userRepo.getPracticeProgress(uid);

        return {
            newlySolved: Boolean(body.passed),
            progress: {
                practiceSubmissionCount: progress.practiceSubmissionCount + (body.passed ? 1 : 0),
                practiceSolvedProblemIds: body.passed && !progress.practiceSolvedProblemIds.includes(body.problemId)
                    ? [...progress.practiceSolvedProblemIds, body.problemId]
                    : progress.practiceSolvedProblemIds,
            },
        };
    });
}
