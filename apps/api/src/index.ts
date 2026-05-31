import { config } from "@algofight/config";
import fastify from "fastify";
import { prisma } from "@algofight/database";
import { enqueueSubmissionJob } from "@algofight/queue";
const app = fastify();

app.get("/", async () => {
    return {
      message: "AlgoFight API running!!."
    };
});

app.post("/submit", async () => {
    const submission = await prisma.submission.create({
        data: {
            language: "typescript",
            code: "console.log('Hello World');",
        },
    });

    await enqueueSubmissionJob({
        submissionId: submission.id,
    });

    return submission;
});
app.get("/submissions", async () => {
    return prisma.submission.findMany();
})

const start = async () => {
    try {
        await app.listen({
            port: config.port,
            host: "0.0.0.0",
        });
        console.log("Server running on port 3000")
    }catch(err) {
        console.error(err);

        process.exit(1);
    }
}



start();