import Generator from "./runner.js";
import PackageJsonGenerator from "./package-json-generator.js";
import NodeGenerator from "./node-generator.js";
import Installer from "./installer.js";
import { printHelp } from "./print-help.js";
import { Logger } from "./logger.js";

const DefaultLogger = {
    write: (message: string) => process.stdout.write(message)
};

export class ExecutionHandler {
    logger: Logger;
    constructor(logger: Logger = DefaultLogger) {
        this.logger = logger;
    }
    handleArguments(args: string[]): Generator | undefined {
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
                return undefined;
            }
        }
    }

    private handleGenerateCommand(args: string[]): Generator | undefined {
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
                return undefined;
            }
        }
    }

    private handlePackageJsonSubcommand(args: string[]): PackageJsonGenerator {
        return new PackageJsonGenerator(args, this.logger);
    }

    private handleNodeSubcommand(args: string[]): NodeGenerator {
        return new NodeGenerator(args, this.logger);
    }

    private handleInstallCommand(_args: string[]) {
        return new Installer();
    }
}
