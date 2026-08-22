import { EventBus } from "../bus/event-bus";

import { LoggingHandler } from "../handlers/logging.handler";

import { MetricsHandler } from "../handlers/metrics.handler";

import { AuditHandler } from "../handlers/audit.handler";

export const registerEvent = (
    eventBus: EventBus,
) => {
    const loggingHandler =
        new LoggingHandler();

    const metricsHandler =
        new MetricsHandler();

    const auditHandler =
        new AuditHandler();

    eventBus.subscribe(
        "submission.created",
        loggingHandler.handle.bind(
            loggingHandler,
        ),
    );

    eventBus.subscribe(
        "submission.created",
        metricsHandler.handle.bind(
            metricsHandler,
        ),
    );

    eventBus.subscribe(
        "submission.created",
        metricsHandler.handle.bind(
            metricsHandler,
        ),
    );

    eventBus.subscribe(
        "submission.created",
        auditHandler.handle.bind(
            auditHandler,
        ),
    );

    eventBus.subscribe(
        "ExecutionCompletedEvent",
        metricsHandler.handle.bind(
            metricsHandler,
        )
    )
};