"use strict";
import parseArgs from "../parseArgs";
import { statSync } from "fs";
import { FieldsOfArgs, PartialArgs as GenericPartialArgs, PartialArgsPlus as GenericPartialArgsPlus } from "./PartialArgs";

export type PartialArgs = GenericPartialArgs<PackageJsonGeneratorArgs>
type PartialArgsPlus<K extends keyof PackageJsonGeneratorArgs> = GenericPartialArgsPlus<PackageJsonGeneratorArgs, K>


export default class PackageJsonGeneratorArgs {
    packageName: string;
    author: string;
    scope: string;
    githubUsername: string;
    githubRepo: string;
    fullPackageName: string;
    rootPath: string;

    constructor(args: string[] | PartialArgs) {
        if (this.isArgv(args)) { args = this.parseArgs(args) }
        this.validateArgs(args);
        this.packageName = args.packageName;
        this.author = args.author;
        this.scope = args.scope;
        this.githubUsername = args.githubUsername;
        this.githubRepo = args.githubRepo;
        this.fullPackageName = args.fullPackageName;
        this.rootPath = args.rootPath;
    }

    private validateArgs(args: unknown): asserts args is FieldsOfArgs<PackageJsonGeneratorArgs> {
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

    private parseArgs(argv: string[]): PartialArgs {
        const { name: packageName, author, scope, githubUsername, githubRepo, fullPackageName, rootPath } = parseArgs(argv);
        return { packageName, author, scope, githubUsername, githubRepo, fullPackageName, rootPath };
    }

    private isValidArg(arg: string | null | undefined): arg is string {
        return arg !== undefined && arg !== null && arg.length > 0;
    }


    private checkPackageName(args: PartialArgs): asserts args is PartialArgsPlus<"packageName"> {
        if (!this.isValidArg(args.packageName)) {
            throw new Error(`You must provide at least a package name and author!
                e.g. ./generate.js generate packageJson -name fancy-http -author "My Name <your@email.com>"`
            );
        }
    }

    private checkAuthorName(args: PartialArgs): asserts args is PartialArgsPlus<"author"> {
        if (!this.isValidArg(args.author)) {
            throw new Error(`You must provide at least a package name and author!
                e.g. ./generate.js generate packageJson -name fancy-http -author "My Name <your@email.com>"`
            );
        }
    }

    private validateScope(args: PartialArgsPlus<"author" | "packageName">): asserts args is PartialArgsPlus<"author" | "packageName" | "scope" | "fullPackageName"> {
        args.scope = args.scope || args.author.match(/<([^>]+)@[^>]*>/)?.[1];
        args.fullPackageName = args.fullPackageName || `@${args.scope}/node-red-${args.packageName}`;
        if (!this.isValidArg(args.scope) || !this.isValidArg(args.fullPackageName)) {
            throw new Error("No scope provided, and unable to parse username from the author string.");
        }
    }

    private validateGithubUsername(args: PartialArgsPlus<"author">): asserts args is PartialArgsPlus<"author" | "githubUsername"> {
        args.githubUsername = args.githubUsername || args.author.match(/<([^>]+)@[^>]*>/)?.[1];
        if (!this.isValidArg(args.githubUsername)) {
            throw new Error("No githubUsername provided and unable to parse it from the author string.");
        }
    }
    private validateGithubRepo(args: PartialArgsPlus<"packageName">): asserts args is PartialArgsPlus<"packageName" | "githubRepo"> {
        args.githubRepo = args.githubRepo || `node-red-${args.packageName}`;
    }
    private validateRootPath(args: PartialArgs): asserts args is PartialArgsPlus<"rootPath"> {
        args.rootPath = args.rootPath || ".";
        if (!this.isValidArg(args.rootPath)) {
            throw new Error("Invalid rootPath provided.");
        }
        const dirStats = statSync(args.rootPath, { throwIfNoEntry: false });
        if (dirStats === undefined) {
            throw new Error("Invalid rootPath provided. Directory not found.");
        }
        if (!dirStats.isDirectory()) {
            throw new Error("Invalid rootPath provided. Must be a directory.");
        }
    }

    private isArgv(args: unknown): args is string[] {
        return (
            Array.isArray(args) &&
            args.every((e) => typeof e === "string")
        );
    }

}
