import { SubmissionStatus } from "@algofight/types";

import { StateMachine } from "../shared/state-machine.interface";
import { transitions } from "./submission-transition";
import { canTransition } from "./transition-validator";
import { InvalidTransitionError } from "./errors/invalid-transition.error";

export class SubmissionStateMachine
   implements StateMachine<SubmissionStatus>
{
    canTransition(current: SubmissionStatus, next: SubmissionStatus): boolean {
        return canTransition(current, next);
    }

    transition(current: SubmissionStatus, next: SubmissionStatus): SubmissionStatus {
        if(!this.canTransition(current, next)) {
            throw new InvalidTransitionError(current, next);
        }

        return next;
    }

    getAvailableTransitions(current: SubmissionStatus): readonly SubmissionStatus[] {
        return transitions[current];
    }
}