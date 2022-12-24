"use strict";
import { readPackageTemplates, templateReplaceAll, templateWriteAll } from "./template_helpers";
import parseArgs from "./parse_args";
import { spawn } from "child_process";

type PackageJsonGeneratorArgs = {
    packageName: string
    author: string
    scope: string
    githubUsername: string
    githubRepo: string
    fullPackageName: string
}

export default class PackageJsonGenerator {
    async generate(args: Partial<PackageJsonGeneratorArgs>): Promise<void> {
        console.log("Generating package.json...");

        if (!this.validateArgs(args)) { return Promise.reject(); }
        let { packageName, author, scope, githubUsername, githubRepo, fullPackageName } = args;

        const templates = await readPackageTemplates();
        const generated = await templateReplaceAll(templates, { packageName, author, githubUsername, githubRepo, fullPackageName });
        await templateWriteAll(generated);
        await this.npmInstall();
        console.log("Done");
    }

    public generateFromArgs(argv: string[]) {
        const args = this.parseArgs(argv);
        return this.generate(args);
    }

    private async npmInstall(): Promise<void> {
        console.log("Running npm install...");
        await new Promise<void>((resolve, reject) => {
            const childProcess = spawn("npm", ["i"], {
                stdio: "inherit"
            });

            childProcess.on("close", (code) => code == 0 ? resolve() : reject(`Non-zero exit code: ${code}`));
        });
        console.log("Done.");
    }

    private validateArgs(args: Partial<PackageJsonGeneratorArgs>): args is PackageJsonGeneratorArgs {
        let { packageName, author, scope, githubUsername, githubRepo, fullPackageName } = args;
        if (!this.checkPackageNameAndAuthor(packageName, author)) { return false; }

        scope = scope || author.match(/<([^>]+)@[^>]*>/)?.[1];
        this.checkScopeAndPackageName(scope, fullPackageName);

        githubUsername = githubUsername || author.match(/<([^>]+)@[^>]*>/)?.[1];
        this.checkGithubUsername(githubUsername);

        githubRepo = githubRepo || `node-red-${packageName}`;
        fullPackageName = fullPackageName || `@${scope}/node-red-${packageName}`;

        return true;
    }

    private parseArgs(argv: string[]): PackageJsonGeneratorArgs {
        let { name: packageName, author, scope, githubUsername, githubRepo, fullPackageName } = parseArgs(argv);
        return { packageName, author, scope, githubUsername, githubRepo, fullPackageName };
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
}
