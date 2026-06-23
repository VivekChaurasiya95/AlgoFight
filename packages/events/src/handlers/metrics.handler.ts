import { DomainEvent } from "../contracts/domain-event";

export class MetricsHandler {
    async handle(
        event: DomainEvent,
    ): Promise<void> {
        console.log(
            `[METRICS] ${event.eventName}`,
        );
    }
}