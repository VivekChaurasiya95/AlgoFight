import {
    runStaleSubmissionJob,
} from "./jobs/stale-submission.job";

import {
    SCHEDULER_INTERVALS,
} from "./constants/scheduler.constants";

setInterval(
    async () => {
        await runStaleSubmissionJob();
    },
    SCHEDULER_INTERVALS.STALE_CHECK,
);