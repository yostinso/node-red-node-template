"use strict";
import { readPackageTemplates, templateReplaceAll, templateWriteAll, addPathPrefixes } from "./templateHelpers";
import parseArgs from "./parseArgs";
import { spawn } from "child_process";
import { Logger } from "./Logger";
import { statSync } from "fs";

export type PackageJsonGeneratorArgs = {
    packageName: string
    author: string
    scope: string
    githubUsername: string
    githubRepo: string
    fullPackageName: string
    rootPath: string
}

type PartialPlus<T, K extends keyof T> = Partial<T> & Required<Pick<T, K>>
type PartialArgs = Partial<PackageJsonGeneratorArgs>
type PartialArgsPlus<K extends keyof PartialArgs> = PartialPlus<PartialArgs, K>

export default class PackageJsonGenerator {
    logger: Logger;
    constructor(logger: Logger) {
        this.logger = logger;
    }
    async generate(args: unknown | PackageJsonGeneratorArgs): Promise<void> {
        this.validateArgs(args);
        this.logger.write("Generating package.json...\n");

        const { packageName, author, githubUsername, githubRepo, fullPackageName } = args;

        const templates = await readPackageTemplates();
        addPathPrefixes(templates, args.rootPath);

        const generated = await templateReplaceAll(templates, { packageName, author, githubUsername, githubRepo, fullPackageName });
        await templateWriteAll(generated);
        await this.npmInstall();
        this.logger.write("Done\n");
    }

    public generateFromArgs(argv: string[]): Promise<void> {
        const args = this.parseArgs(argv);
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

    private validateArgs(args: unknown): asserts args is PackageJsonGeneratorArgs {
        if (typeof args !== "object" || args === null) {
            throw new Error("Expected an arguments object");
        }
        this.checkPackageName(args);
        this.checkAuthorName(args);
        this.validateScope(args);
        this.validateGithubUsername(args);
        this.validateGithubRepo(args);
        this.validateRootPath(args);
    }

    private parseArgs(argv: string[]): PackageJsonGeneratorArgs {
        const { name: packageName, author, scope, githubUsername, githubRepo, fullPackageName, rootPath } = parseArgs(argv);
        return { packageName, author, scope, githubUsername, githubRepo, fullPackageName, rootPath };
    }

    private isValidArg(arg: string | null | undefined): arg is string {
        return arg !== undefined && arg !== null && arg.length > 0;
    }


    private checkPackageName(args: PartialArgs): asserts args is PartialArgsPlus<"packageName"> {
        if (!this.isValidArg(args.packageName)) {
            throw new Error(`You must provide at least a package name and author!
                e.g. ./generate.js generate packageJson -name fancy-http -author "My Name <your@email.com>"\n`
            );
        }
    }

    private checkAuthorName(args: PartialArgs): asserts args is PartialArgsPlus<"author"> {
        if (!this.isValidArg(args.author)) {
            throw new Error(`You must provide at least a package name and author!
                e.g. ./generate.js generate packageJson -name fancy-http -author "My Name <your@email.com>"\n`
            );
        }
    }

    private validateScope(args: PartialArgsPlus<"author" | "packageName">): asserts args is PartialArgsPlus<"author" | "packageName" | "scope" | "fullPackageName"> {
        args.scope = args.scope || args.author.match(/<([^>]+)@[^>]*>/)?.[1];
        args.fullPackageName = args.fullPackageName || `@${args.scope}/node-red-${args.packageName}`;
        if (!this.isValidArg(args.scope) || !this.isValidArg(args.fullPackageName)) {
            throw new Error(`No scope provided, and unable to parse username from the author string.\n`);
        }
    }

    private validateGithubUsername(args: PartialArgsPlus<"author">): asserts args is PartialArgsPlus<"author" | "githubUsername"> {
        args.githubUsername = args.githubUsername || args.author.match(/<([^>]+)@[^>]*>/)?.[1];
        if (!this.isValidArg(args.githubUsername)) {
            throw new Error(`No githubUsername provided and unable to parse it from the author string.\n`);
        }
    }
    private validateGithubRepo(args: PartialArgsPlus<"packageName">): asserts args is PartialArgsPlus<"packageName" | "githubRepo"> {
        args.githubRepo = args.githubRepo || `node-red-${args.packageName}`;
    }
    private validateRootPath(args: PartialArgs): asserts args is PartialArgsPlus<"rootPath"> {
        args.rootPath = args.rootPath || ".";
        if (!this.isValidArg(args.rootPath)) {
            throw new Error(`Invalid rootPath provided.\n`);
        }
        const dirStats = statSync(args.rootPath, { throwIfNoEntry: false });
        if (dirStats === undefined) {
            throw new Error(`Invalid rootPath provided. Directory not found.\n`);
        }
        if (!dirStats.isDirectory()) {
            throw new Error(`Invalid rootPath provided. Must be a directory.\n`);
        }
    }
}
