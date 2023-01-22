import { expect, describe, it } from "vitest";
import parseArgs from "../generate/parse-args.js";

describe("parseArgs", () => {
    it("should parse any pairs of arguments", () => {
        const argv = [
            "--one", "one",
            "--two", "two",
            "--three", "--four",
        ];

        const result = parseArgs(argv);

        expect(result).toMatchObject({
            one: "one",
            two: "two",
            three: "--four"
        });
    });
    it("should drop weird things", () => {
        const argv = [
            "what", // leading unflagged arg
            "--one", "one",
            "--two", "two",
            "--three", "--four",
            "--five" // trailing flag
        ];

        const result = parseArgs(argv);

        expect(result).toMatchObject({
            one: "one",
            two: "two",
            three: "--four"
        });

    });
});