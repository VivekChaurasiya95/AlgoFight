import { DomainEvent } from "../contracts/domain-event";

export class AuditHandler {
    async handle(
        event: DomainEvent,
    ): Promise<void> {
        console.log(
            `[AUDIT] ${event.eventName}`,
        );
    }
}