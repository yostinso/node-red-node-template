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
    printHelp();
    if (err) console.error(err);
});

/*
export function _npmInstall() {
    console.log("Running npm install...");
    return new Promise((resolve, reject) => {
        spawn("npm", ["i"], {
            stdio: "inherit"
        }).on("close", (code) => {
            code == 0 ? resolve() : reject(code);
        });
    }).then(() => {
        console.log("Done.");
    });
}

*/