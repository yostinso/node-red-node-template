import { it, describe, expect } from "@jest/globals";
import { writeJson } from "../generate/templateHelpers";
import NodeGenerator from "../generate/NodeGenerator";
import * as os from "os";
import * as path from "path";
import * as fs from "fs/promises";

jest.mock("../generate/templateHelpers", () => {
    const original = jest.requireActual("../generate/templateHelpers");
    return {
        ...original,
        writeJson: jest.fn()
    };
});
const { writeJson: _writeJson } = jest.requireActual("../generate/templateHelpers");
jest.mock("fs/promises", () => {
    const original = jest.requireActual("fs/promises");
    return {
        ...original,
        readFile: jest.fn().mockImplementation(original.readFile)
    };
});
const { readFile: _readFile } = jest.requireActual("fs/promises");

let logMessages = "";
const logger = {
    write: jest.fn((message: string) => {
        logMessages = logMessages + message;
        return true;
    })
};

describe(NodeGenerator, () => {
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
            let mockedGenerateNodeViews: jest.SpyInstance<Promise<void[]>, []>;
            beforeEach(() => {
                mockedGenerateNodeViews = jest.spyOn(NodeGenerator.prototype as unknown as { generateNodeViews: () => Promise<void[]> }, "generateNodeViews");
                mockedGenerateNodeViews.mockImplementation(jest.fn());
            });
            afterEach(() => {
                mockedGenerateNodeViews.mockReset();
            });

            it("should add the new node to package.json if it doesn't exist", async () => {
                const args = {
                    nodeName: "node-name",
                    packageName: "package-name",
                    rootPath: os.tmpdir()
                };
                const expectedJsonPath = path.join(os.tmpdir(), "package.json");

                const generator = new NodeGenerator(args, logger);
                await generator.generate();

                expect(jest.mocked(writeJson)).toBeCalledWith(
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

                jest.mocked(fs.readFile).mockImplementationOnce((path, options) => {
                    if (typeof path === "string" && path.match("package.json")) {
                        return Promise.resolve(JSON.stringify(fakePackageJson));
                    } else {
                        return _readFile(path, options);
                    }
                });

                const generator = new NodeGenerator(args, logger);
                await generator.generate();

                expect(jest.mocked(writeJson)).toBeCalledWith(
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

                jest.mocked(fs.readFile).mockImplementation((path, options) => {
                    if (typeof path === "string" && path.match("package.json")) {
                        return Promise.resolve(JSON.stringify(fakePackageJson));
                    } else {
                        return _readFile(path, options);
                    }
                });

                const generator = new NodeGenerator(args, logger);
                await generator.generate();

                expect(jest.mocked(writeJson)).toBeCalledWith(
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

                jest.mocked(fs.readFile).mockImplementation((path, options) => {
                    if (typeof path === "string" && path.match("package.json")) {
                        return Promise.resolve(JSON.stringify(fakePackageJson));
                    } else {
                        return _readFile(path, options);
                    }
                });

                const generator = new NodeGenerator(args, logger);
                await generator.generate();

                expect(jest.mocked(writeJson)).toBeCalledWith(
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