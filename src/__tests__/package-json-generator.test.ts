import "@yostinso/vitest-matchjsonobject";
import * as fs from "fs/promises";
import * as os from "os";
import path from "path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import PackageJsonGeneratorArgs from "../generate/args/package-json-generator-args.js";
import PackageJsonGenerator from "../generate/package-json-generator.js";
import * as templateHelpersType from "../generate/template-helpers.js";
import { addPathPrefixes, templateReplaceAll, templateWriteAll } from "../generate/template-helpers.js";

vi.mock("../generate/template-helpers.js", async () => {
    const original = (await vi.importActual("../generate/template-helpers.js")) as typeof templateHelpersType;
    return {
        ...original,
        addPathPrefixes: vi.fn().mockImplementation(original.addPathPrefixes), 
        templateReplaceAll: vi.fn().mockImplementation(original.templateReplaceAll), 
        templateWriteAll: vi.fn()
    };
});

let logMessages = "";
const logger = {
    write: vi.fn((message: string) => {
        logMessages = logMessages + message;
        return true;
    })
};

describe("PackageJsonGenerator", () => {
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

            await generator.run();
            
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
                rootPath: "src/"
            };
            const args = [
                "--name", "package-name",
                "--author", "Test User <author@email.com>",
                "--githubUsername", "custom-author",
                "--fullPackageName", "@custom-scope/custom-full-package-name",
                "--githubRepo", "custom-repo",
                "--scope", "custom-specific-scope",
                "--rootPath", "src/"
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
            const npmI = vi.spyOn(PackageJsonGenerator.prototype as unknown as { npmInstall: () => Promise<void> }, "npmInstall");
            npmI.mockImplementation(vi.fn());
            expect(npmI).toBeCalledTimes(1);
            */

            const generator = new PackageJsonGenerator(args, logger);
            await generator.run();

            expect(vi.mocked(templateWriteAll)).toHaveBeenCalledWith(
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
            beforeAll(async () => {
                const { templateWriteAll: _templateWriteAll } = (await vi.importActual("../generate/template-helpers.js")) as typeof templateHelpersType;
                vi.mocked(templateWriteAll).mockImplementation(_templateWriteAll);
            });
            afterAll(() => {
                vi.mocked(templateWriteAll).mockImplementation(vi.fn<Promise<void>[]>());
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
                await generator.run();

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