"use strict";
import PackageJsonGenerator from "./PackageJsonGenerator";
import NodeGenerator from "./NodeGenerator";
import { Installer } from "./Installer";
import { printHelp } from "./printHelp";

export class ExecutionHandler {
    handleArguments(args: string[]): Promise<void> {
        let [command, ...argv] = args;
        switch (command) {
            case "generate":
                return this.handleGenerateCommand(argv);
            case "install":
                return this.handleInstallCommand(argv);
            default:
                printHelp();
                if (command)
                    console.log("Invalid command ", command);
                return Promise.resolve();
        }
    }

    private handleGenerateCommand(args: string[]): Promise<void> {
        let [subcommand, ...argv] = args;
        switch (subcommand) {
            case "packageJson":
                return this.handlePackageJsonSubcommand(argv);
            case "node":
                return this.handleNodeSubcommand(argv);
                break;
            default:
                printHelp();
                console.log("Invalid subcommand ", subcommand);
                return Promise.resolve();
        }
    }

    private handlePackageJsonSubcommand(args: string[]): Promise<void> {
        const generator = new PackageJsonGenerator();
        return generator.generateFromArgs(args);
    }

    private handleNodeSubcommand(args: string[]): Promise<void> {
        const generator = new NodeGenerator();
        return generator.generateFromArgs(args);
    }

    private handleInstallCommand(args: string[]) {
        const installer = new Installer();
        return installer.install();
    }
}
