import {
    runStaleSubmissionJob,
} from "./jobs/stale-submission.job";

import {
    SCHEDULER_INTERVALS,
} from "./constants/scheduler.constants";
import { logger } from "@algofight/logger";

logger.info({interval: SCHEDULER_INTERVALS.STALE_CHECK,},"Scheduler service has started");
const schedulerInterval = setInterval(
    async () => {
        try {
            await runStaleSubmissionJob();
        } catch (error) {
            logger.error(
                { error },
                "Stale submission job failed",
            );
        }
    },
    SCHEDULER_INTERVALS.STALE_CHECK,
);

process.on(
    "SIGINT",
    () => {
        logger.info("Scheduler shutting down");

        clearInterval(
            schedulerInterval,
        )
        process.exit(0);
    }
)
process.on(
    "SIGTERM",
    () => {
        logger.info("Scheduler shutting down");
        process.exit(0);
    }
)