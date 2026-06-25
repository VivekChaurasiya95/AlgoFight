import { Comparator } from "./comparator.interface";

export class ExactComparator implements Comparator{
    compare(
        expectedOutput: string,
        actualOutput: string,
    ): boolean {
        const expected = expectedOutput.trim();

        const actual = actualOutput.trim();

        return expected == actual;
    }
}