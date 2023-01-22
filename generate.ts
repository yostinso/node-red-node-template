#!/usr/bin/env node
import { printHelp } from "./generate/print-help.js";
import { ExecutionHandler } from "./generate/execution-handler.js";


function main() {
    const executer = new ExecutionHandler();
    const runner = executer.handleArguments(process.argv.slice(2));
    return runner ? runner.run() : Promise.resolve();
}

main().catch((err) => {
    printHelp(process.stdout);
    if (err) console.error(err);
});