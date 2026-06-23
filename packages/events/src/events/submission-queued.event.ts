import { DomainEvent } from "../contracts/domain-event";

export interface SubmissionQueuedPayload {
    submissionId: string;
}

export class SubmissionQueuedEvent
    implements DomainEvent<SubmissionQueuedPayload>

{
    readonly eventName = 
        "submission.queued";
    
    readonly occurredAt = 
        new Date();

    constructor(
        public readonly payload:
            SubmissionQueuedPayload,
    ) {}


}