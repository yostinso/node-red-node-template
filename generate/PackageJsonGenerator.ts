"use strict";
import { readPackageTemplates, templateReplaceAll, templateWriteAll } from "./templateHelpers";
import parseArgs from "./parseArgs";
import { spawn } from "child_process";
import { Logger } from "./Logger";
import { stat } from "fs/promises";

export type PackageJsonGeneratorArgs = {
    packageName: string
    author: string
    scope: string
    githubUsername: string
    githubRepo: string
    fullPackageName: string
    rootPath: string
}

export default class PackageJsonGenerator {
    logger: Logger;
    constructor(logger: Logger) {
        this.logger = logger;
    }
    async generate(args: PackageJsonGeneratorArgs): Promise<void> {
        this.logger.write("Generating package.json...\n");

        const { packageName, author, githubUsername, githubRepo, fullPackageName } = args;

        const templates = await readPackageTemplates();
        const generated = await templateReplaceAll(templates, { packageName, author, githubUsername, githubRepo, fullPackageName });
        await templateWriteAll(generated);
        await this.npmInstall();
        this.logger.write("Done\n");
    }

    public async generateFromArgs(argv: string[]): Promise<void> {
        const args = this.parseArgs(argv);
        if (!(await this.validateArgs(args))) { return Promise.reject() }
        return this.generate(args);
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

    private async validateArgs(args: Partial<PackageJsonGeneratorArgs>): Promise<boolean> {
        const { packageName, author, scope, githubUsername, githubRepo, fullPackageName, rootPath } = args;
        if (!this.checkPackageNameAndAuthor(packageName, author)) { return false }

        args.scope = scope || author.match(/<([^>]+)@[^>]*>/)?.[1];
        args.fullPackageName = fullPackageName || `@${args.scope}/node-red-${args.packageName}`;
        this.checkScopeAndPackageName(args.scope, args.fullPackageName);

        args.githubUsername = githubUsername || author.match(/<([^>]+)@[^>]*>/)?.[1];
        this.checkGithubUsername(args.githubUsername);

        args.githubRepo = githubRepo || `node-red-${args.packageName}`;

        args.rootPath = rootPath || ".";
        await this.checkRootPath(args.rootPath);

        return true;
    }

    private parseArgs(argv: string[]): PackageJsonGeneratorArgs {
        const { name: packageName, author, scope, githubUsername, githubRepo, fullPackageName, rootPath } = parseArgs(argv);
        return { packageName, author, scope, githubUsername, githubRepo, fullPackageName, rootPath };
    }

    private isValidArg(arg: string | null | undefined): arg is string {
        return arg !== undefined && arg !== null && arg.length > 0;
    }

    private checkPackageNameAndAuthor(packageName?: string, author?: string): author is string {
        if (!this.isValidArg(packageName) || !this.isValidArg(author)) {
            throw new Error(`
                You must provide at least a package name and author!
                e.g. ./generate.js generate packageJson -name fancy-http -author "My Name <your@email.com>"\n`
            );
        }
        return true;
    }

    private checkScopeAndPackageName(scope?: string, fullPackageName?: string) {
        if (!this.isValidArg(scope) || !this.isValidArg(fullPackageName)) {
            throw new Error(`
            No scope provided, and unable to parse username from the author string.\n`
            );
        }
    }

    private checkGithubUsername(githubUsername?: string): void {
        if (!this.isValidArg(githubUsername)) {
            throw new Error(`
            No githubUsername provided and unable to parse it from the author string.\n`
            );
        }
    }

    private async checkRootPath(rootPath?: string): Promise<void> {
        if (!this.isValidArg(rootPath)) {
            throw new Error(`
            Invalid rootPath provided.\n`
            );
        }
        const dirStats = await stat(rootPath).catch(() => {
            throw new Error(`
            Invalid rootPath provided. Directory not found.\n`
            );
        });
        if (!dirStats.isDirectory()) {
            throw new Error(`
            Invalid rootPath provided. Must be a directory.\n`
            );
        }
    }
}
