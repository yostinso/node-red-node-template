import { describe, expect, it, vi } from "vitest";
import { ExecutionHandler } from "../generate/execution-handler";
import Installer from "../generate/installer.js";
import NodeGenerator from "../generate/node-generator";
import PackageJsonGenerator from "../generate/package-json-generator.js";

vi.mock("../generate/installer.js");
vi.mock("../generate/package-json-generator.js");
vi.mock("../generate/node-generator.js");

describe("ExecutionHandler", () => {
    describe("--help", () => {
        it("it generates a help message", () => {
            const args = ["--help"];
            const executer = new ExecutionHandler();
            const stdoutWrite = vi.spyOn(process.stdout, "write");

            const runner = executer.handleArguments(args);
            expect(runner).toBeUndefined();

            expect(stdoutWrite).toBeCalledWith(expect.stringMatching("./generate.js command"));
            expect(stdoutWrite).not.toHaveBeenCalledWith(expect.stringMatching("Invalid command"));
        });
    });
    it("it shows Invalid command", () => {
        const args = [ "oops" ];
        const executer = new ExecutionHandler();
        const stdoutWrite = vi.spyOn(process.stdout, "write");

        const runner = executer.handleArguments(args);
        expect(runner).toBeUndefined();

        expect(stdoutWrite).toBeCalledWith(expect.stringMatching("./generate.js command"));
        expect(stdoutWrite).toHaveBeenCalledWith(expect.stringMatching("Invalid command"));
    });

    describe("install", () => {
        it("it returns an Installer", () => {

            const args = ["install", "extra", "args"];
            const executer = new ExecutionHandler();

            const result = executer.handleArguments(args);
            expect(result).toBeInstanceOf(Installer);
            expect(Installer).toHaveBeenCalledTimes(1);
        });
    });

    describe("generate", () => {
        describe("--help", () => {
            it("it generates a help message", () => {
                const args = ["generate", "--help"];
                const executer = new ExecutionHandler();
                const stdoutWrite = vi.spyOn(process.stdout, "write");

                executer.handleArguments(args);

                expect(stdoutWrite).toBeCalledWith(expect.stringMatching("./generate.js command"));
                expect(stdoutWrite).not.toHaveBeenCalledWith(expect.stringMatching("Invalid.*command"));
            });
        });
        it("it shows Invalid subcommand", () => {
            const args = [ "generate", "oops" ];
            const executer = new ExecutionHandler();
            const stdoutWrite = vi.spyOn(process.stdout, "write");

            executer.handleArguments(args);

            expect(stdoutWrite).toBeCalledWith(expect.stringMatching("./generate.js command"));
            expect(stdoutWrite).toHaveBeenCalledWith(expect.stringMatching("Invalid.*command"));
        });
        describe("packageJson", () => {
            it("it creates and calls the PackageJsonGenerator", () => {

                const args = ["generate", "packageJson", "extra", "args"];
                const executer = new ExecutionHandler();

                const runner = executer.handleArguments(args);
                expect(runner).toBeInstanceOf(PackageJsonGenerator);
                expect(PackageJsonGenerator).toHaveBeenCalledWith(["extra", "args"], expect.anything());
            });
        });
        describe("node", () => {
            it("it creates and calls the NodeGenerator", () => {

                const args = ["generate", "node", "extra", "args"];
                const executer = new ExecutionHandler();

                const runner = executer.handleArguments(args);
                expect(runner).toBeInstanceOf(NodeGenerator);
                expect(NodeGenerator).toHaveBeenCalledWith(["extra", "args"], expect.anything());
            });
        });
    });
});

