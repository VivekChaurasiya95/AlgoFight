import { ZodType } from "zod";

export abstract class Validator<T> {
    constructor(
        protected readonly schema: ZodType<T>,
    ) {}

    validate(data: unknown): T {
        return this.schema.parse(data);
    }

}