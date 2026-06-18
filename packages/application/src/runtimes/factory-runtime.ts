import { LanguageRuntime }
from "./language-runtime";

import { JavaScriptRuntime }
from "./javascript-runtime";

export class RuntimeFactory {

    static getRuntime(
        language: string,
    ): LanguageRuntime {

        switch (
            language.toLowerCase()
        ) {

            case "javascript":
                return new JavaScriptRuntime();

            default:
                throw new Error(
                    `Unsupported language: ${language}`,
                );
        }
    }
}