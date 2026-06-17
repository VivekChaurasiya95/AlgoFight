import { RecoveryService } from "../services/recovery.service";

const recoveryService =
    new RecoveryService();

export const runStaleSubmissionJob =
    async () => {

        await recoveryService
            .runRecoveryCycle();
    };