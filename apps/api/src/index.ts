import { config } from "@algofight/config";
import fastify from "fastify";
import {
  PrismaSubmissionRepository,
} from "@algofight/database";
import { enqueueSubmissionJob } from "@algofight/queue";

import {
    SubmissionInput,
    submissionSchema,
} from "./schema/submission.schema";
const app = fastify();
const submissionRepository =
  new PrismaSubmissionRepository();
app.get("/", async () => {
    return {
      message: "AlgoFight API running!!."
    };
});

app.post("/submit", async (request) => {

    const body: SubmissionInput = 
         submissionSchema.parse(
            request.body,
         )
    const submission = await submissionRepository.createSubmission({
        language: body.language,
        code: body.code,
    });

    await enqueueSubmissionJob({
        submissionId: submission.id,
    });

    return submission;
});
app.get("/submissions", async () => {
    return submissionRepository.getAllSubmission();
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