import { DomainEvent } from "../contracts/domain-event";

export interface SubmissionFailedPayload {
    submissionId: string;
    reason: string;
}

export class SubmissionFailedEvent
    implements DomainEvent<SubmissionFailedPayload>
{
    readonly eventName = 
       "submission.failed";

    readonly occurredAt = 
        new Date();

    constructor(
        public readonly payload:
            SubmissionFailedPayload,
    ) {}
}