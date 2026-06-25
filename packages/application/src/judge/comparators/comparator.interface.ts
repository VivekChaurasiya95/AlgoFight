export interface Comparator {
    compare(
        expectedOutput: string,
        actualOutput: string,
    ): boolean;
}