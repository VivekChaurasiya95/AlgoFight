import { DomainEvent } from "../contracts/domain-event";

export interface ExecutionStartedPayload {
    submissionId: string;
}

export class ExecutionStartedEvent
    implements DomainEvent<ExecutionStartedPayload>
{
    readonly eventName =
        "execution.started";

    readonly occurredAt = 
        new Date();

    constructor(
        public readonly payload:
            ExecutionStartedPayload,
    ) {}
}