import { LOG_CONTEXT, logger } from "./index";

export const createLogger = (
    context: 
    (typeof LOG_CONTEXT)[keyof typeof LOG_CONTEXT],
) => {
    return logger.child({
        context,
    });
};