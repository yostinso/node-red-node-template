import { describe, expect, it } from "@jest/globals";
import * as fs from "fs/promises";
import * as os from "os";
import path from "path";
import PackageJsonGenerator, { PackageJsonGeneratorArgs } from "../generate/PackageJsonGenerator";
import { templateWriteAll, addPathPrefixes, templateReplaceAll } from "../generate/templateHelpers";
import "./util";

jest.mock("../generate/templateHelpers", () => {
    const original = jest.requireActual("../generate/templateHelpers");
    return {
        ...original,
        addPathPrefixes: jest.fn().mockImplementation(original.addPathPrefixes), 
        templateReplaceAll: jest.fn().mockImplementation(original.templateReplaceAll), 
        templateWriteAll: jest.fn(),
        _templateWriteAll: original.templateWriteAll
    };
});

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
            const args = [
                "--bogus", "package-name",
                "--author", "author@email.com"
            ];
            expect(() => {
                new PackageJsonGenerator(args, logger);
            }).toThrow(/provide at least a package name and author/);
        });
        it("it should parse minimal args", async () => {
            const expected: Omit<PackageJsonGeneratorArgs, "rootPath" | "scope"> = {
                author: "Test User <author@email.com>",
                packageName: "package-name",
                githubUsername: "author",
                fullPackageName: "@author/node-red-package-name",
                githubRepo: "node-red-package-name",
            };
            const expectedRootPath = ".";
            const args = [
                "--name", "package-name",
                "--author", "Test User <author@email.com>"
            ];
            const generator = new PackageJsonGenerator(args, logger);

            await generator.generate();
            
            expect(addPathPrefixes).toBeCalledWith(expect.anything(), expectedRootPath);
            expect(templateReplaceAll).toBeCalledWith(
                expect.anything(),
                expect.objectContaining(expected)
            );
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
            const generator = new PackageJsonGenerator(args, logger);
            expect(generator.args).toMatchObject(expected);
        });
        it("it should print an error on bad Github username", () => {
            const args = [
                "--name", "package-name",
                "--author", "Test User <>",
                "--scope", "scope"
            ];
            expect(
                () => new PackageJsonGenerator(args, logger)
            ).toThrow(/No githubUsername/);
        });
        it("it should print an error on bad scope", () => {
            const args = [
                "--name", "package-name",
                "--author", "Test User <>"
            ];
            expect(
                () => new PackageJsonGenerator(args, logger)
            ).toThrow(/No scope provided/);
        });
        it("it should print an error on missing rootPath", () => {
            const args = [
                "--name", "package-name",
                "--author", "Test User <author@email.com>",
                "--rootPath", "./this-doesnt-exist"
            ];
            expect(
                () => new PackageJsonGenerator(args, logger)
            ).toThrow(/Invalid rootPath .* Directory not found/);
        });
        it("it should print an error on non-folder rootPath", () => {
            const args = [
                "--name", "package-name",
                "--author", "Test User <author@email.com>",
                "--rootPath", "./package.json"
            ];
            expect(
                () => new PackageJsonGenerator(args, logger)
            ).toThrow(/Invalid rootPath .* Must be a directory/);
        });
    });

    describe("generate", () => {
        let tmpDir = os.tmpdir();
        beforeAll(async () => {
            const prefix = path.join(os.tmpdir(), "test-generate");
            tmpDir = await fs.mkdtemp(prefix);
        });
        afterAll(async () => {
            if (tmpDir != os.tmpdir()) {
                fs.rm(tmpDir, { recursive: true });
            }
        });

        it("should try to write out generated templates", async () => {
            const args: PackageJsonGeneratorArgs = {
                author: "testuser@gmail.com",
                packageName: "test-package",
                githubUsername: "testuser",
                fullPackageName: "@test/test-package",
                githubRepo: "test-package-repo",
                scope: "test",
                rootPath: tmpDir
            };
            const npmI = jest.spyOn(PackageJsonGenerator.prototype as unknown as { npmInstall: () => Promise<void> }, "npmInstall");
            npmI.mockImplementation(jest.fn());

            const generator = new PackageJsonGenerator(args, logger);
            await generator.generate();
            expect(npmI).toBeCalledTimes(1);

            expect(jest.mocked(templateWriteAll)).toHaveBeenCalledWith(
                expect.objectContaining({
                    "package.json": expect.toMatchJSONObject({
                        "name": "@test/test-package"
                    }),
                    "tsconfig.json": expect.toMatchJSONObject({
                        "compilerOptions": expect.any(Object)
                    })
                })
            );
        });
    });
});