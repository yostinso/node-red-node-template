import { it, describe, expect } from "@jest/globals";
import PackageJsonGenerator, { PackageJsonGeneratorArgs } from "../generate/PackageJsonGenerator";
/*
import { templateWriteAll } from "../generate/templateHelpers";
jest.mock("../generate/template_helpers", () => {
    const original = jest.requireActual("../generate/templateHelpers");
    return {
        __esModule: true,
        ...original,
        templateWriteAll: jest.fn()
    };
});
*/

let logMessages = "";
const logger = {
    write: jest.fn((message: string) => {
        logMessages = logMessages + message;
        return true;
    })
};

describe(PackageJsonGenerator, () => {
    beforeEach(() => { logMessages = "" });

    describe("generateFromArgs", () => {
        const generateMock = jest.spyOn(PackageJsonGenerator.prototype, "generate");
        beforeEach(() => { generateMock.mockClear() });
        afterAll(() => generateMock.mockRestore());

        it("it should print an error on bad arguments", () => {
            const generator = new PackageJsonGenerator(logger);
            expect(() => {
                return generator.generateFromArgs(["--bogus", "package-name", "--author", "author@email.com"]);
            }).rejects.toThrow(/provide at least a package name and author/);
        });
        it("it should parse minimal args", async () => {
            const expected: PackageJsonGeneratorArgs = {
                author: "Test User <author@email.com>",
                packageName: "package-name",
                githubUsername: "author",
                fullPackageName: "@author/node-red-package-name",
                githubRepo: "node-red-package-name",
                scope: "author",
                rootPath: "."
            };
            const args = [
                "--name", "package-name",
                "--author", "Test User <author@email.com>"
            ];
            const generator = new PackageJsonGenerator(logger);
            generateMock.mockImplementationOnce(jest.fn());
            await generator.generateFromArgs(args);

            expect(generateMock).toBeCalledWith(expect.objectContaining(expected));
        });
        it("it should parse complete args", async () => {
            const expected: PackageJsonGeneratorArgs = {
                author: "Test User <author@email.com>",
                packageName: "package-name",
                githubUsername: "custom-author",
                fullPackageName: "@custom-scope/custom-full-package-name",
                githubRepo: "custom-repo",
                scope: "custom-specific-scope",
                rootPath: "test/"
            };
            const args = [
                "--name", "package-name",
                "--author", "Test User <author@email.com>",
                "--githubUsername", "custom-author",
                "--fullPackageName", "@custom-scope/custom-full-package-name",
                "--githubRepo", "custom-repo",
                "--scope", "custom-specific-scope",
                "--rootPath", "test/"
            ];
            const generator = new PackageJsonGenerator(logger);
            generateMock.mockImplementationOnce(jest.fn());
            await generator.generateFromArgs(args);

            expect(generateMock).toBeCalledWith(expect.objectContaining(expected));
        });
        it("it should print an error on bad Github username", () => {
            const args = [
                "--name", "package-name",
                "--author", "Test User <>",
                "--scope", "scope"
            ];
            const generator = new PackageJsonGenerator(logger);
            return expect(() => {
                return generator.generateFromArgs(args);
            }).rejects.toThrow(/No githubUsername/);
        });
        it("it should print an error on bad scope", () => {
            const args = [
                "--name", "package-name",
                "--author", "Test User <>"
            ];
            const generator = new PackageJsonGenerator(logger);
            return expect(() => {
                return generator.generateFromArgs(args);
            }).rejects.toThrow(/No scope provided/);
        });
        it("it should print an error on missing rootPath", () => {
            const args = [
                "--name", "package-name",
                "--author", "Test User <author@email.com>",
                "--rootPath", "./this-doesnt-exist"
            ];
            const generator = new PackageJsonGenerator(logger);
            return expect(() => {
                return generator.generateFromArgs(args);
            }).rejects.toThrow(/Invalid rootPath .* Directory not found/);
        });
        it("it should print an error on non-folder rootPath", () => {
            const args = [
                "--name", "package-name",
                "--author", "Test User <author@email.com>",
                "--rootPath", "./package.json"
            ];
            const generator = new PackageJsonGenerator(logger);
            return expect(() => {
                return generator.generateFromArgs(args);
            }).rejects.toThrow(/Invalid rootPath .* Must be a directory/);
        });
    });

    /*
    describe("generate", () => {
        it("it should generate templates", () => {
            const args: PackageJsonGeneratorArgs = {
                author: "testuser@gmail.com",
                packageName: "test-package",
                githubUsername: "testuser",
                fullPackageName: "@test/test-package",
                githubRepo: "test-package-repo",
                scope: "test"
            };

            const generator = new PackageJsonGenerator(logger);
            generator.generate(args);
            expect(jest.mocked(templateWriteAll)).toBeCalledWith("derp");
        });
    });
    */
});