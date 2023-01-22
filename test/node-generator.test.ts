import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, SpyInstance, vi } from "vitest";
import NodeGenerator from "../generate/node-generator.js";
import { writeJson } from "../generate/template-helpers.js";

vi.mock("../generate/template-helpers.js", () => {
    const original = vi.importActual("../generate/template-helpers.js");
    return {
        ...original,
        writeJson: vi.fn()
    };
});
vi.mock("fs/promises", async () => {
    const original = (await vi.importActual("fs/promises")) as typeof fs;
    return {
        ...original,
        readFile: vi.fn().mockImplementation(original.readFile)
    };
});
const { readFile: _readFile } = (await vi.importActual("fs/promises")) as typeof fs;

let logMessages = "";
const logger = {
    write: vi.fn((message: string) => {
        logMessages = logMessages + message;
        return true;
    })
};

describe("NodeGenerator", () => {
    beforeEach(() => { logMessages = "" });
    describe("constructor", () => {
        it("should print an error on a missing node name", () => {
            const args = [
                "--packageName", "package-name"
            ];
            expect(() => {
                new NodeGenerator(args, logger);
            }).toThrow(/provide at least a node name/);
        });
        it("should allow a missing package name and rootPath", () => {
            const expected = {
                nodeName: "node-name",
                packageName: undefined,
                rootPath: "."
            };
            const args = [
                "--name", "node-name"
            ];

            const nodeGenerator = new NodeGenerator(args, logger);

            expect(nodeGenerator.args).toEqual(expected);
        });
        it("should parse a package name when provided", () => {
            const expected = {
                nodeName: "node-name",
                packageName: "package-name",
                rootPath: "."
            };
            const args = [
                "--name", "node-name",
                "--packageName", "package-name"
            ];

            const nodeGenerator = new NodeGenerator(args, logger);

            expect(nodeGenerator.args).toEqual(expected);
        });
        it("should print an error on missing rootPath", () => {
            const args = [
                "--name", "node-name",
                "--packageName", "package-name",
                "--rootPath", "./this-doesnt-exist"
            ];
            expect(
                () => new NodeGenerator(args, logger)
            ).toThrow(/Invalid rootPath .* Directory not found/);
        });
        it("should print an error on non-folder rootPath", () => {
            const args = [
                "--name", "node-name",
                "--packageName", "package-name",
                "--rootPath", "./package.json"
            ];
            expect(
                () => new NodeGenerator(args, logger)
            ).toThrow(/Invalid rootPath .* Must be a directory/);
        });
        it("should error on a bogus args argument", () => {
            const args = "what" as unknown as string[];
            expect(
                () => new NodeGenerator(args, logger)
            ).toThrow(/Expected an arguments object/);
        });
    });
    describe("generate", () => {
        let tmpDir = os.tmpdir();
        beforeAll(async () => {
            const prefix = path.join(os.tmpdir(), "test-generate-node");
            tmpDir = await fs.mkdtemp(prefix);
        });
        afterAll(async () => {
            if (tmpDir != os.tmpdir()) {
                await fs.rm(tmpDir, { recursive: true });
            }
        });
        describe("package.json without views", () => {
            let mockedGenerateNodeViews: SpyInstance<[], Promise<void[]>>;
            beforeEach(() => {
                mockedGenerateNodeViews = vi.spyOn(NodeGenerator.prototype as unknown as { generateNodeViews: () => Promise<void[]> }, "generateNodeViews");
                mockedGenerateNodeViews.mockImplementation(vi.fn<Promise<void>[]>());
            });
            afterEach(() => {
                mockedGenerateNodeViews.mockReset();
            });

            it("should error if package.json doesn't exist", async () => {
                const args = {
                    nodeName: "node-name",
                    packageName: "package-name",
                    rootPath: os.tmpdir()
                };
                const generator = new NodeGenerator(args, logger);

                vi.mocked(fs.readFile).mockRejectedValueOnce({ code: "ENOENT" });
                await expect(generator.run()).rejects.toMatch(/Must generate package.json first/);

                vi.mocked(fs.readFile).mockRejectedValueOnce({ code: "123" });
                await expect(generator.run()).rejects.toEqual({ code: "123" });

                vi.mocked(fs.readFile).mockRejectedValueOnce({ other: "thing" });
                await expect(generator.run()).rejects.toMatch(/Unable to parse/);
            });

            it("should add the new node to package.json if it doesn't exist", async () => {
                const args = {
                    nodeName: "node-name",
                    packageName: "package-name",
                    rootPath: os.tmpdir()
                };
                const expectedJsonPath = path.join(os.tmpdir(), "package.json");

                const generator = new NodeGenerator(args, logger);
                await generator.run();

                expect(vi.mocked(writeJson)).toBeCalledWith(
                    expectedJsonPath,
                    expect.objectContaining({
                        "node-red": {
                            nodes: {
                                "package-name-node-name": "dist/package-name-node-name.js"
                            }
                        }
                    })
                );
            });

            it("should replace any existing node in package.json if it does exist", async () => {
                const args = {
                    nodeName: "node-name",
                    packageName: "package-name",
                    rootPath: os.tmpdir()
                };
                const fakePackageJson = {
                    "node-red": {
                        nodes: { "package-name-node-name": "EXISTS" }
                    }
                };
                const expectedJsonPath = path.join(os.tmpdir(), "package.json");

                vi.mocked(fs.readFile).mockImplementationOnce((path, options) => {
                    if (typeof path === "string" && path.match("package.json")) {
                        return Promise.resolve(JSON.stringify(fakePackageJson));
                    } else {
                        return _readFile(path, options);
                    }
                });

                const generator = new NodeGenerator(args, logger);
                await generator.run();

                expect(vi.mocked(writeJson)).toBeCalledWith(
                    expectedJsonPath,
                    expect.objectContaining({
                        "node-red": {
                            nodes: {
                                "package-name-node-name": "dist/package-name-node-name.js"
                            }
                        }
                    })
                );
            });

            it("should leave any other nodes intact", async () => {
                const args = {
                    nodeName: "node-name",
                    packageName: "package-name",
                    rootPath: os.tmpdir()
                };
                const fakePackageJson = {
                    "node-red": {
                        nodes: { "OTHER": "EXISTS" }
                    }
                };
                const expectedJsonPath = path.join(os.tmpdir(), "package.json");

                vi.mocked(fs.readFile).mockImplementation((path, options) => {
                    if (typeof path === "string" && path.match("package.json")) {
                        return Promise.resolve(JSON.stringify(fakePackageJson));
                    } else {
                        return _readFile(path, options);
                    }
                });

                const generator = new NodeGenerator(args, logger);
                await generator.run();

                expect(vi.mocked(writeJson)).toBeCalledWith(
                    expectedJsonPath,
                    expect.objectContaining({
                        "node-red": {
                            nodes: {
                                "package-name-node-name": "dist/package-name-node-name.js",
                                "OTHER": "EXISTS"
                            }
                        }
                    })
                );
            });

            it("should populate the node-red and node-red.nodes keys of package.json if missing", async () => {
                const args = {
                    nodeName: "node-name",
                    packageName: "package-name",
                    rootPath: os.tmpdir()
                };
                const fakePackageJson = {};
                const expectedJsonPath = path.join(os.tmpdir(), "package.json");

                vi.mocked(fs.readFile).mockImplementation((path, options) => {
                    if (typeof path === "string" && path.match("package.json")) {
                        return Promise.resolve(JSON.stringify(fakePackageJson));
                    } else {
                        return _readFile(path, options);
                    }
                });

                const generator = new NodeGenerator(args, logger);
                await generator.run();

                expect(vi.mocked(writeJson)).toBeCalledWith(
                    expectedJsonPath,
                    expect.objectContaining({
                        "node-red": {
                            nodes: {
                                "package-name-node-name": "dist/package-name-node-name.js",
                            }
                        }
                    })
                );
            });
        });
        describe("views", () => {
            it.todo("installs the tsconfig for views");
            it.todo("installs the icons for views");
            it.todo("installs the locales for views");
            it.todo("installs the templates for views");
        });
    });
});