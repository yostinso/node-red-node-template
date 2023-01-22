import { expect } from "vitest";
import { RawMatcherFn, AsymmetricMatcher, equals, iterableEquality, subsetEquality } from "@vitest/expect";

const toMatchJSONObject: RawMatcherFn = function (actual, expected) {
    const options = {
        isNot: this.isNot, promise: this.promise
    };

    if (typeof actual !== "string") {
        throw new Error(
            this.utils.matcherHint("toMatchJSONObject", undefined, undefined, options) +
            `: ${this.utils.RECEIVED_COLOR("received")} value must be a string. ` +
            `Received: ${this.utils.printReceived(actual)}`
        );
    }

    let obj: unknown;
    try {
        obj = JSON.parse(actual);
    } catch {
        throw new Error(
            this.utils.matcherHint("toMatchJSONObject", undefined, undefined, options) +
            `: ${this.utils.RECEIVED_COLOR("received")} value must be stringified JSON. ` +
            `Received: ${this.utils.printReceived(actual)}`
        );
    }

    const pass = equals(obj, expected, [iterableEquality, subsetEquality]);
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
            this.utils.matcherHint("toMatchJSONObject", this.utils.stringify(obj), this.utils.stringify(expected), options)
            ;

    return { pass, message };
};

expect.extend({ toMatchJSONObject });

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Vi {
        interface AsymmetricMatchersContaining {
            toMatchJSONObject(expected: object): AsymmetricMatcher<[unknown, Record<string, unknown>]>;
        }
        interface JestAssertion<T = any> {
            toMatchJSONObject(expected: object): T;
        }
    }
}