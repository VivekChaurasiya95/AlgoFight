import {ZodType} from "zod";

export const validateRequest = <T>(
    schema: ZodType<T>,
    data: unknown,
): T => {
    return schema.parse(data);
};