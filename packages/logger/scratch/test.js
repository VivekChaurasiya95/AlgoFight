const pino = require('pino');

const telemetryStream = {
    write: (logJsonString) => {
        console.log("TELEMETRY:", logJsonString.trim());
    }
};

const isDevelopment = true;

const logger = pino({
    level: "info",
    base: { service: "test" }
}, pino.multistream([
    { stream: isDevelopment ? pino.transport({ target: 'pino-pretty' }) : process.stdout },
    { stream: telemetryStream }
]));

logger.info("Hello world");
