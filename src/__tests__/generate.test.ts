import { it, describe, expect } from "vitest";
import { execFile, ExecFileException } from "child_process";

type ChildProcessResult = {
    error?: ExecFileException
    stdout: string
    stderr: string
}

function run(args: string[]): Promise<ChildProcessResult> {
    return new Promise((resolve) => {
        execFile("npm", ["run", "generate", "--", ...args], (error, stdout, stderr) => {
            resolve({
                error: (error == null) ? undefined : error,
                stdout,
                stderr
            });
        });
    });
}

describe("generate", () => {
    describe("--help", () => {
        it("it should print help text", async () => {
            const result = await run(["--help"]);
            console.log(result.stdout);
            console.log(result.stderr);
            expect(result.stdout).toContain("./generate.js command");
            expect(result.stdout).not.toContain("Invalid command");
        });
    });
});