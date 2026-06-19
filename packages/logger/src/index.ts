import pino from "pino";

const isDevelopment =
    process.env.NODE_ENV !== "production";

export const logger = pino({
    level:
        process.env.LOG_LEVEL || "info",

    transport: isDevelopment
        ? {
              target: "pino-pretty",
              options: {
                  colorize: true,
              },
          }
        : undefined,

    base: {
        service: "algofight",
    },

    redact: [
        "password",
        "token",
        "authorization",
    ],

    timestamp:
        pino.stdTimeFunctions.isoTime,
});

export * from "./logger-factory";
export * from "./constants/logger.constants";
export type * from "./types/log-metadata.type";