import { it, describe, expect, vi, afterEach } from "vitest";
import { readPackageTemplates, templateReplaceAll, templateWriteAll, writeJson, addPathPrefixes } from "../generate/template-helpers.js";
import * as fs from "fs/promises";
const { writeFile } = fs;

vi.mock("fs/promises", async () => {
    const original = await vi.importActual("fs/promises") as typeof fs;
    return {
        ...original,
        writeFile: vi.fn()
    };
});

describe("readPackageTemplates", () => {
    it("reads package templates", async () => {
        const result = await readPackageTemplates();
        expect(result).toMatchObject({
            "package.json": expect.any(String),
            "tsconfig.json": expect.any(String)
        });
    });
    it("refers to templates that are valid JSON", async () => {
        const result = await readPackageTemplates();
        const packageJson = JSON.parse(result["package.json"]);
        const tsConfig = JSON.parse(result["tsconfig.json"]);
        expect(packageJson).toMatchObject({ name: expect.any(String) });
        expect(tsConfig).toMatchObject({ compilerOptions: expect.any(Object) });
    });
});

describe("templateReplaceAll", () => {
    it("naively search-and-replaces variables by name", async () => {
        const template = JSON.stringify({
            test: "${variable1}",
            "${variable2}": "two"
        });
        const templates = { somePath: template };
        const replacements = {
            variable1: "ONE",
            variable2: "TWO"
        };
        const replaced = templateReplaceAll(templates, replacements);
        const replacedObj = JSON.parse(replaced.somePath);
        expect(replacedObj).toEqual({
            test: "ONE",
            TWO: "two"
        });
    });
});

describe("addPathPrefixes", () => {
    it("should update the paths in the template keys with the provided prefix", () => {
        const templates = { "path1.json": "1", "path2.json": "2" };
        const prefix = "some/prefix";
        const expected = { "some/prefix/path1.json": "1", "some/prefix/path2.json": "2" };

        const result = addPathPrefixes(templates, prefix);

        expect(result).toEqual(expected);
    });
});

describe("write methods", () => {
    const mockedWriteFile = vi.mocked(writeFile);
    afterEach(() => {
        mockedWriteFile.mockClear();
    });

    describe("templateWriteAll", () => {
        it("reads package templates", async () => {
            const templateContents = JSON.stringify({ test: "one" });
            const templates = {
                "some/path": templateContents
            };
            await templateWriteAll(templates);
            expect(mockedWriteFile).toBeCalledWith("some/path", templateContents);
        });
        it("logs messages to an optional callback", async () => {
            const templateContents = JSON.stringify({ test: "one" });
            const templates = { "some/path": templateContents };
            const callback = vi.fn();

            await templateWriteAll(templates, callback);

            expect(callback).toBeCalledWith("Generated some/path");
        });
    });

    describe("writeJson", () => {
        it("writes JSON to a file as a formatted string", async () => {
            const obj = { one: "two" };
            const expected = `{\n    "one": "two"\n}`;

            await writeJson("some/path", obj);

            const mockedWriteFile = vi.mocked(writeFile);
            expect(mockedWriteFile).toBeCalledWith("some/path", expected);
        });
    });
});