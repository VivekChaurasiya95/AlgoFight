import { DomainEvent } from "../contracts/domain-event";

export interface SubmissionCreatedPayload {
    submissionId: string;
}

export class SubmissionCreatedEvent
    implements DomainEvent<SubmissionCreatedPayload>
{
    readonly eventName = 
        "submission.created";

    readonly occurredAt =
        new Date();
    
        constructor(
            public readonly payload:
                SubmissionCreatedPayload,
        ) {}
}
