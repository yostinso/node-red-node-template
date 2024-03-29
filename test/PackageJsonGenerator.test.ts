import { describe, expect, it } from "@jest/globals";
import * as fs from "fs/promises";
import * as os from "os";
import path from "path";
import PackageJsonGenerator from "../generate/PackageJsonGenerator";
import PackageJsonGeneratorArgs from "../generate/args/PackageJsonGeneratorArgs";
import { templateWriteAll, addPathPrefixes, templateReplaceAll } from "../generate/templateHelpers";
import "./util";

jest.mock("../generate/templateHelpers", () => {
    const original = jest.requireActual("../generate/templateHelpers");
    return {
        ...original,
        addPathPrefixes: jest.fn().mockImplementation(original.addPathPrefixes), 
        templateReplaceAll: jest.fn().mockImplementation(original.templateReplaceAll), 
        templateWriteAll: jest.fn()
    };
});
const { templateWriteAll: _templateWriteAll } = jest.requireActual("../generate/templateHelpers");

let logMessages = "";
const logger = {
    write: jest.fn((message: string) => {
        logMessages = logMessages + message;
        return true;
    })
};

describe(PackageJsonGenerator, () => {
    beforeEach(() => { logMessages = "" });

    describe("constructor", () => {
        it("should print an error on bad arguments", () => {
            const args = [
                "--bogus", "package-name",
                "--author", "author@email.com"
            ];
            expect(() => {
                new PackageJsonGenerator(args, logger);
            }).toThrow(/provide at least a package name and author/);
        });
        it("should parse minimal args", async () => {
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
        it("should parse complete args", async () => {
            const expected = {
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
        it("should print an error on bad Github username", () => {
            const args = [
                "--name", "package-name",
                "--author", "Test User <>",
                "--scope", "scope"
            ];
            expect(
                () => new PackageJsonGenerator(args, logger)
            ).toThrow(/No githubUsername/);
        });
        it("should print an error on bad scope", () => {
            const args = [
                "--name", "package-name",
                "--author", "Test User <>"
            ];
            expect(
                () => new PackageJsonGenerator(args, logger)
            ).toThrow(/No scope provided/);
        });
        it("should print an error on missing rootPath", () => {
            const args = [
                "--name", "package-name",
                "--author", "Test User <author@email.com>",
                "--rootPath", "./this-doesnt-exist"
            ];
            expect(
                () => new PackageJsonGenerator(args, logger)
            ).toThrow(/Invalid rootPath .* Directory not found/);
        });
        it("should print an error on non-folder rootPath", () => {
            const args = [
                "--name", "package-name",
                "--author", "Test User <author@email.com>",
                "--rootPath", "./package.json"
            ];
            expect(
                () => new PackageJsonGenerator(args, logger)
            ).toThrow(/Invalid rootPath .* Must be a directory/);
        });
        it("should error on a bogus args argument", () => {
            const args = "what" as unknown as string[];
            expect(
                () => new PackageJsonGenerator(args, logger)
            ).toThrow(/Expected an arguments object/);
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
                await fs.rm(tmpDir, { recursive: true });
            }
        });

        it("should try to write out generated package/tsconfig templates", async () => {
            const args = {
                author: "testuser@gmail.com",
                packageName: "test-package",
                githubUsername: "testuser",
                fullPackageName: "@test/test-package",
                githubRepo: "test-package-repo",
                scope: "test",
                rootPath: tmpDir
            };
            /*
            const npmI = jest.spyOn(PackageJsonGenerator.prototype as unknown as { npmInstall: () => Promise<void> }, "npmInstall");
            npmI.mockImplementation(jest.fn());
            expect(npmI).toBeCalledTimes(1);
            */

            const generator = new PackageJsonGenerator(args, logger);
            await generator.generate();

            expect(jest.mocked(templateWriteAll)).toHaveBeenCalledWith(
                expect.objectContaining({
                    [`${tmpDir}/package.json`]: expect.toMatchJSONObject({
                        "name": "@test/test-package"
                    }),
                    [`${tmpDir}/tsconfig.json`]: expect.toMatchJSONObject({
                        "compilerOptions": expect.any(Object)
                    })
                })
            );
        });

        describe("when writing isn't mocked", () => {
            beforeAll(() => {
                jest.mocked(templateWriteAll).mockImplementation(_templateWriteAll);
            });
            afterAll(() => {
                jest.mocked(templateWriteAll).mockImplementation(jest.fn());
            });

            it("should actually write the package/tsconfig files to a temp dir", async () => {
                const args = {
                    author: "testuser@gmail.com",
                    packageName: "test-package",
                    githubUsername: "testuser",
                    fullPackageName: "@test/test-package",
                    githubRepo: "test-package-repo",
                    scope: "test",
                    rootPath: tmpDir
                };

                const generator = new PackageJsonGenerator(args, logger);
                await generator.generate();

                expect(await fs.stat(tmpDir)).not.toBeFalsy();
                const files = await fs.readdir(tmpDir, "utf-8");
                expect(files).toContain("package.json");
                expect(files).toContain("tsconfig.json");
                
                const packageJson = await fs.readFile(path.join(tmpDir, "package.json"), "utf-8");
                expect(packageJson).toMatchJSONObject({
                    "name": "@test/test-package"
                });

                const tsConfigJson = await fs.readFile(path.join(tmpDir, "tsconfig.json"), "utf-8");
                expect(tsConfigJson).toMatchJSONObject({
                    "compilerOptions": expect.any(Object)
                });
            });
        });
    });
});