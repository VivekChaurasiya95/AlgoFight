import pino from "pino";
import pinoPretty from "pino-pretty";
import { Writable } from "node:stream";

const TELEMETRY_URL =
    process.env.TELEMETRY_URL || "http://localhost:8000";

// Standard Node.js Writable Stream that dispatches logs to the Linux server
const telemetryStream = new Writable({
    write(chunk, _encoding, callback) {
        try {
            const logJsonString = chunk.toString();
            fetch(`${TELEMETRY_URL}/api/v1/telemetry/logs`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: logJsonString,
            }).catch(() => {
                // Silently ignore if telemetry server is restarting
            });
        } catch {
            // Ignore parse/fetch errors
        }
        callback();
    },
});

const prettyStream = pinoPretty({
    colorize: true,
    translateTime: "yyyy-mm-dd HH:MM:ss",
    ignore: "pid,hostname",
    singleLine: false,
    messageFormat: "[{service}] {msg}",
});

export const logger = pino(
    {
        level: process.env.LOG_LEVEL || "info",
        base: {
            service: "algofight",
        },
        redact: [
            "password",
            "token",
            "authorization",
        ],
        timestamp: pino.stdTimeFunctions.isoTime,
    },
    pino.multistream([
        { stream: prettyStream },
        { stream: telemetryStream },
    ])
);

export * from "./logger-factory";
export * from "./constants/logger.constants";
export type * from "./types/log-metadata.type";
