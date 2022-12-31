"use strict";
import { readPackageTemplates, templateReplaceAll, templateWriteAll, addPathPrefixes } from "./templateHelpers";
import { spawn } from "child_process";
import { Logger } from "./Logger";
import PackageJsonGeneratorArgs, { PartialArgs } from "./args/PackageJsonGeneratorArgs";

export default class PackageJsonGenerator {
    logger: Logger;
    args: PackageJsonGeneratorArgs;
    constructor(args: string[] | PartialArgs, logger: Logger) {
        this.logger = logger;
        this.args = new PackageJsonGeneratorArgs(args);
    }
    async generate(): Promise<void> {
        this.logger.write("Generating package.json...\n");

        const { packageName, author, githubUsername, githubRepo, fullPackageName } = this.args;

        let templates = await readPackageTemplates();
        templates = addPathPrefixes(templates, this.args.rootPath);

        const generated = await templateReplaceAll(templates, { packageName, author, githubUsername, githubRepo, fullPackageName });
        await templateWriteAll(generated);
        //await this.npmInstall();
        this.logger.write("Done\n");
    }

    private async npmInstall(): Promise<void> {
        this.logger.write("Running npm install...\n");
        await new Promise<void>((resolve, reject) => {
            const childProcess = spawn("npm", ["i"], {
                stdio: "inherit"
            });

            childProcess.on("close", (code) => code == 0 ? resolve() : reject(`Non-zero exit code: ${code}`));
        });
        this.logger.write("Done.\n");
    }
}
