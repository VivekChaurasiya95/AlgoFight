import { DomainEvent } from "../contracts/domain-event";

export interface ExecutionCompletedPayload {
    submissionId: string;
}

export class ExecutionCompletedEvent
    implements DomainEvent<ExecutionCompletedPayload>
{
    readonly eventName = 
       "execution.completed";
    
    readonly occurredAt = 
        new Date();

    constructor(
        public readonly payload:
            ExecutionCompletedPayload,
    ) {}
}