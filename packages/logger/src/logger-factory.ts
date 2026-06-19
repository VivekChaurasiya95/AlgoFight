import { logger } from "./index";

export const createLogger = (
    context: string,
) => {
    return logger.child({
        context,
    });
};