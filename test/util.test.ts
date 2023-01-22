import { describe, it, expect } from "vitest";
import "./util.js";

describe("toMatchJSONObject", () => {
    it("should error on a non-string actual value", () => {
        const expected = {};
        const actual = 123;
        expect(
            () => expect(actual).toMatchJSONObject(expected)
        ).toThrow(/value must be a string/);
    });
    it("should error on invalid JSON", () => {
        const expected = {};
        const actual = "{";
        expect(
            () => expect(actual).toMatchJSONObject(expected)
        ).toThrow(/value must be .* JSON/);
    });
    it("should fail on a mismatched object", () => {
        const expected = { a: 3 };
        const actual = `{ "a": 1, "b": 2 }`;
        expect(
            () => expect(actual).toMatchJSONObject(expected)
        ).toThrow(/toMatchJSONObject.*\n.*"a": 3/);
    });
    it("should succeed on a matched object", () => {
        const expected = { a: 1 };
        const actual = `{ "a": 1, "b": 2 }`;
        expect(actual).toMatchJSONObject(expected);
    });
    it("should fail with a matched object and an inverted test (.not)", () => {
        const expected = { a: 1 };
        const actual = `{ "a": 1, "b": 2 }`;
        expect(
            () => expect(actual).not.toMatchJSONObject(expected)
        ).toThrow(/Expected:.*not/);
    });
    it("should succeed with a mismatched object and an inverted test (.not)", () => {
        const expected = { a: 3 };
        const actual = `{ "a": 1, "b": 2 }`;
        expect(actual).not.toMatchJSONObject(expected);
    });
});
describe("jsonObjectMatching", () => {
    it ("should succeed with a matching object", () => {
        const expected = { a: 1 };
        const actual = `{ "a": 1, "b": 2 }`;
        const matcher = expect.toMatchJSONObject(expected);
        expect(matcher.asymmetricMatch(actual)).toBe(true);
    });
    it("should fail with a mismatched object", () => {
        const expected = { a: 3 };
        const actual = `{ "a": 1, "b": 2 }`;
        const matcher = expect.toMatchJSONObject(expected);
        expect(matcher.asymmetricMatch(actual)).toBe(false);
    });
});