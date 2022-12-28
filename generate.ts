#!/usr/bin/env node
"use strict";
import { printHelp } from "./generate/printHelp";
import { ExecutionHandler } from "./generate/ExecutionHandler";


function main() {
    const executer = new ExecutionHandler();
    executer.handleArguments(process.argv.slice(2));
    return Promise.resolve();
}

main().catch((err) => {
    printHelp(process.stdout);
    if (err) console.error(err);
});