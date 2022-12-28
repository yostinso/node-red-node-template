"use strict";
import PackageJsonGenerator from "./PackageJsonGenerator";
import NodeGenerator from "./NodeGenerator";
import Installer from "./Installer";
import { printHelp } from "./printHelp";
import { Logger } from "./Logger";

const DefaultLogger = {
    write: (message: string) => process.stdout.write(message)
};

export class ExecutionHandler {
    logger: Logger;
    constructor(logger: Logger = DefaultLogger) {
        this.logger = logger;
    }
    handleArguments(args: string[]): Promise<void> {
        const [command, ...argv] = args;
        switch (command) {
            case "generate":
                return this.handleGenerateCommand(argv);
            case "install":
                return this.handleInstallCommand(argv);
            default: {
                printHelp(this.logger);
                const isHelp = command == "--help" || argv.includes("--help");
                if (command && !isHelp)
                    this.logger.write(`Invalid command ${command}\n`);
                return Promise.resolve();
            }
        }
    }

    private handleGenerateCommand(args: string[]): Promise<void> {
        const [subcommand, ...argv] = args;
        switch (subcommand) {
            case "packageJson":
                return this.handlePackageJsonSubcommand(argv);
            case "node":
                return this.handleNodeSubcommand(argv);
            default: {
                printHelp(this.logger);
                const isHelp = subcommand == "--help" || argv.includes("--help");
                if (subcommand && !isHelp)
                    this.logger.write(`Invalid subcommand ${subcommand}\n`);
                return Promise.resolve();
            }
        }
    }

    private handlePackageJsonSubcommand(args: string[]): Promise<void> {
        const generator = new PackageJsonGenerator(this.logger);
        return generator.generateFromArgs(args);
    }

    private handleNodeSubcommand(args: string[]): Promise<void> {
        const generator = new NodeGenerator();
        return generator.generateFromArgs(args);
    }

    private handleInstallCommand(_args: string[]) {
        const installer = new Installer();
        return installer.install();
    }
}
