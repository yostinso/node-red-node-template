"use strict";
import { readFile, mkdir } from "fs/promises";
import { copyIfNotExists } from "./fs_helpers";
import { readNodeTemplates, templateReplaceAll, templateWriteAll, writeJson, NODE_ICON } from "./templateHelpers";
import parseArgs from "./parseArgs";
import { Logger } from "./Logger";

export type NodeGeneratorArgs = {
    nodeName: string
    packageName: string
}

type PartialPlus<T, K extends keyof T> = Partial<T> & Required<Pick<T, K>>
type PartialArgs = Partial<NodeGeneratorArgs>
type PartialArgsPlus<K extends keyof PartialArgs> = PartialPlus<PartialArgs, K>

type PartialPackageJson = {
    packageName?: string
    "node-red"?: {
        nodes?: {
            [fullNodeName: string]: string
        }
    }
}

function isArgv(args: unknown): args is string[] {
    return (
        Array.isArray(args) &&
        args.every((e) => typeof e === "string")
    );
}
export default class NodeGenerator {
    logger: Logger;
    args: NodeGeneratorArgs;
    constructor(args: string[] | PartialArgs, logger: Logger) {
        this.logger = logger;

        if (isArgv(args)) { args = this.parseArgs(args) }
        this.validateArgs(args);
        this.args = args;
    }

    private parseArgs(argv: string[]): PartialArgs {
        const { name: nodeName, packageName } = parseArgs(argv);
        return { nodeName, packageName };
    }

    private validateArgs(args: unknown): asserts args is NodeGeneratorArgs {
        if (typeof args !== "object" || args === null) {
            throw new Error("Expected an arguments object");
        }
        this.checkNodeName(args);
        this.checkPackageName(args);
    }

    private checkNodeName(args: PartialArgs): asserts args is PartialArgsPlus<"nodeName"> {
        if (typeof args.nodeName !== "string" || args.nodeName.length == 0) {
            throw new Error("You must provide at least a node name and packageName.");
        }
    }
    private checkPackageName(args: PartialArgs): asserts args is PartialArgsPlus<"packageName"> {
        if (typeof args.packageName !== "string" || args.packageName.length == 0) {
            throw new Error("You must provide at least a node name and packageName.");
        }
    }

    public async generate(args: Partial<NodeGeneratorArgs>) {
        let { nodeName, packageName } = args;
        if (!nodeName) { return Promise.reject("Must provide a node name!") }

        let pkgJson = await this.getPackageJson();
        packageName ||= pkgJson.packageName;
        if (!packageName) { return Promise.reject("Must provide a valid package name!") }

        pkgJson = this.addNodeToPkgJson(packageName, nodeName, pkgJson);

        await writeJson("package.json", pkgJson);
        await this.generateNodeViews(packageName, nodeName);

        console.log("Done");
    }

    private addNodeToPkgJson(packageName: string, nodeName: string, pkgJson: PartialPackageJson) {
        let nodeRed = pkgJson["node-red"] || {};
        let nodes = nodeRed.nodes || {};
        nodes = { ...nodes, [`${packageName}-${nodeName}`]: `dist/${packageName}-${nodeName}.js` };
        nodeRed = { ...nodeRed, nodes };
        pkgJson = { ...pkgJson, "node-red": nodeRed };
        return pkgJson;
    }

    private getPackageJson(): Promise<PartialPackageJson> {
        return readFile("package.json", "utf8")
            .catch((err) => Promise.reject(err.code == "ENOENT" ? "Must generate package.json first!" : err))
            .then((json) => JSON.parse(json));
    }

    private generateNodeViews(packageName: string, nodeName: string) {
        const nodeClass = nodeName.replace(/(?:^|-)([a-z])/g, (m, letter) => letter.toUpperCase());

        return mkdir(`${packageName}/views`, { recursive: true })
            .then(() => mkdir(`${packageName}/icons`, { recursive: true }))
            .then(() => {
                return Promise.all([
                    copyIfNotExists("template/views/tsconfig.template.json", `${packageName}/views/tsconfig.json`).then(([copied, src, dest]) => {
                        copied ? console.log(`Copied ${src} to ${dest}`) : console.log(`${dest} already exists`);
                    }),
                    copyIfNotExists(NODE_ICON, `${packageName}/icons/`).then(([copied, src, dest]) => {
                        copied ? console.log(`Copied ${src} to ${dest}`) : console.log(`${dest} already exists`);
                    }),
                ]);
            })
            .then(() => mkdir(`${packageName}/locales/en-US`, { recursive: true }))
            .then(() => readNodeTemplates())
            .then((templates) => templateReplaceAll(templates, { nodeName, packageName, nodeClass }))
            .then((generated) => templateWriteAll(generated));
    }

    public generateFromArgs(argv: string[]) {
        const args = this.parseArgs(argv);
        return this.generate(args);
    }
}
