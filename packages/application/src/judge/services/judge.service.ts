import { ExactComparator }
from "../comparators/exact-comparator";

import { Verdict }
from "../verdict/verdict";

import { VerdictEngine }
from "../verdict/verdict-engine";

export type JudgeInput = {
    expectedOutput: string;

    actualOutput: string;
};

export class JudgeService {

    private readonly comparator =
        new ExactComparator();

    private readonly verdictEngine =
        new VerdictEngine();

    judge(
        input: JudgeInput,
    ): Verdict {

        const isMatch =
            this.comparator.compare(
                input.expectedOutput,
                input.actualOutput,
            );

        return this.verdictEngine
            .determineVerdict({
                isMatch,
            });
    }
}