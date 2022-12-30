import { expect } from "@jest/globals";
import { getObjectSubset } from "@jest/expect-utils";
import type { MatcherFunction } from "expect";

const toMatchJSONObject: MatcherFunction<[expected: object]> =
    function (actual, expected) {
        const options = {
            isNot: this.isNot, promise: this.promise
        };

        if (typeof actual !== "string") {
            throw new Error(
                this.utils.matcherErrorMessage(
                    this.utils.matcherHint("toMatchJSONObject", undefined, undefined, options),
                    `${this.utils.RECEIVED_COLOR("received")} value must be a string`,
                    this.utils.printWithType("Received", actual, this.utils.printReceived)
                )
            );
        }

        let obj: unknown;
        try {
            obj = JSON.parse(actual);
        } catch {
            throw new Error(
                this.utils.matcherErrorMessage(
                    this.utils.matcherHint("toMatchJSONObject", undefined, undefined, options),
                    `${this.utils.RECEIVED_COLOR("received")} value must be stringified JSON`,
                    this.utils.printWithType("Received", actual, this.utils.printReceived)
                )
            );
        }

        const pass = this.equals(obj, expected, [this.utils.iterableEquality, this.utils.subsetEquality]);
        const message = pass
            ?
            () =>
                this.utils.matcherHint("toMatchJSONObject", undefined, undefined, options) +
                "\n\n" +
                `Expected: not ${this.utils.printExpected(expected)}` +
                (this.utils.stringify(expected) !== this.utils.stringify(obj)
                    ? `\nReceived:     ${this.utils.printReceived(obj)}`
                    : "")
            : () =>
                this.utils.matcherHint("toMatchJSONObject", undefined, undefined, options) +
                "\n\n" +
                this.utils.printDiffOrStringify(
                    expected,
                    getObjectSubset(obj, expected),
                    "Expected",
                    "Received",
                    (this.expand !== false)
                );

        return  { pass, message };
    };

expect.extend({ toMatchJSONObject });

declare module "expect" {
    interface AsymmetricMatchers {
        toMatchJSONObject(expected: object): AsymmetricMatcher<[unknown, Record<string, unknown>]>;
    }
    interface Matchers<R> {
        toMatchJSONObject(expected: object): R;
    }
}