import { Verdict } from "./verdict";
import { VerdictInput } from "./verdict.types";
export interface VerdictRule {
    readonly name: Verdict;
    readonly priority: number;

    matches (input: VerdictInput): boolean;
}
