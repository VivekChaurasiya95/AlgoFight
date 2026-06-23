import { DomainEvent } from "../contracts/domain-event";

export class LoggingHandler {
    async handle(
        event: DomainEvent,
    ): Promise<void> {
        console.log(
            `[EVENT] ${event.eventName}`,
            event.payload,
        );
    }
}