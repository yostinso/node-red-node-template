import { it, describe, expect } from "@jest/globals";
import { ExecutionHandler } from "../generate/ExecutionHandler";

import Installer from "../generate/Installer";
jest.mock("../generate/Installer");
const MockedInstaller = jest.mocked(Installer);

import PackageJsonGenerator from "../generate/PackageJsonGenerator";
jest.mock("../generate/PackageJsonGenerator");

import NodeGenerator from "../generate/NodeGenerator";
jest.mock("../generate/NodeGenerator");
const MockedNodeGenerator = jest.mocked(NodeGenerator);

let logMessages = "";
const logger = {
    write: jest.fn((message: string) => {
        logMessages = logMessages + message;
        return true;
    })
};

describe(ExecutionHandler, () => {
    beforeEach(() => { logMessages = "" });
    describe("--help", () => {
        it("it generates a help message", () => {
            const args = ["--help"];
            const executer = new ExecutionHandler(logger);

            executer.handleArguments(args);

            expect(logMessages).toContain("./generate.js command");
            expect(logMessages).not.toContain("Invalid command");
        });
    });
    it("it shows Invalid command", () => {
        const args = [ "oops" ];
        const executer = new ExecutionHandler(logger);

        executer.handleArguments(args);

        expect(logMessages).toContain("./generate.js command");
        expect(logMessages).toContain("Invalid command");
    });

    describe("install", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });
        it("it creates and calls the Installer", () => {

            const args = ["install", "extra", "args"];
            const executer = new ExecutionHandler(logger);

            executer.handleArguments(args);

            expect(Installer).toHaveBeenCalledTimes(1);
            expect(MockedInstaller.mock.instances[0].install).toHaveBeenCalledTimes(1);
        });
    });

    describe("generate", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });
        describe("--help", () => {
            it("it generates a help message", () => {
                const args = ["generate", "--help"];
                const executer = new ExecutionHandler(logger);

                executer.handleArguments(args);

                expect(logMessages).toContain("./generate.js command");
                expect(logMessages).not.toContain("Invalid.*command");
            });
        });
        it("it shows Invalid subcommand", () => {
            const args = [ "generate", "oops" ];
            const executer = new ExecutionHandler(logger);

            executer.handleArguments(args);

            expect(logMessages).toContain("./generate.js command");
            expect(logMessages).toContain("Invalid subcommand");
        });
        describe("packageJson", () => {
            it("it creates and calls the PackageJsonGenerator", () => {

                const args = ["generate", "packageJson", "extra", "args"];
                const executer = new ExecutionHandler(logger);

                const mockGenerate = jest.spyOn(PackageJsonGenerator.prototype, "generate").mockImplementationOnce(jest.fn());

                executer.handleArguments(args);

                expect(PackageJsonGenerator).toHaveBeenCalledWith(["extra", "args"], expect.anything());
                expect(mockGenerate).toHaveBeenCalledTimes(1);
            });
        });
        describe("node", () => {
            it("it creates and calls the NodeGenerator", () => {

                const args = ["generate", "node", "extra", "args"];
                const executer = new ExecutionHandler(logger);

                const mockGenerate = jest.spyOn(NodeGenerator.prototype, "generate").mockImplementationOnce(jest.fn());

                executer.handleArguments(args);

                expect(MockedNodeGenerator).toHaveBeenCalledWith(["extra", "args"], expect.anything());
                expect(mockGenerate).toHaveBeenCalledTimes(1);
            });
        });
    });
});

