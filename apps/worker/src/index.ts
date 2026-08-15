import "@algofight/config";
import "@algofight/queue/src/workers/submission.worker";
import { logger } from "@algofight/logger"; // 👈 Clean package import

logger.info("Worker service started");

process.on("SIGINT", () => {
    logger.info("Worker shutting down");
    process.exit(0);
});

process.on("SIGTERM", () => {
    logger.info("Worker shutting down");
    process.exit(0);
});
