"use strict";
import { readFile, mkdir } from "fs/promises";
import { copyIfNotExists } from "./fs_helpers";
import { readNodeTemplates, templateReplaceAll, templateWriteAll, writeJson, NODE_ICON } from "./templateHelpers";
import { Logger } from "./Logger";
import NodeGeneratorArgs, { PartialArgs } from "./args/NodeGeneratorArgs";
import path from "path";

type PartialPackageJson = {
    packageName?: string
    "node-red"?: {
        nodes?: {
            [fullNodeName: string]: string
        }
    }
}

export default class NodeGenerator {
    logger: Logger;
    args: NodeGeneratorArgs;
    constructor(args: string[] | PartialArgs, logger: Logger) {
        this.logger = logger;
        this.args = new NodeGeneratorArgs(args);
    }

    public async generate() {
        let { nodeName, packageName, rootPath } = this.args;

        let pkgJson = await this.getPackageJson();
        packageName ||= pkgJson.packageName;
        if (!packageName) { return Promise.reject("Must provide a valid package name!") }

        pkgJson = this.addNodeToPkgJson(packageName, nodeName, pkgJson);

        const packageJsonPath = path.join(rootPath, "package.json");
        await writeJson(packageJsonPath, pkgJson);
        await this.generateNodeViews(packageName, nodeName);

        this.logger.write("Done\n");
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
            .then((json) => JSON.parse(json)).catch(() => Promise.reject("Unable to parse package.json"));
    }

    private generateNodeViews(packageName: string, nodeName: string) {
        const nodeClass = nodeName.replace(/(?:^|-)([a-z])/g, (m, letter) => letter.toUpperCase());

        return mkdir(`${packageName}/views`, { recursive: true })
            .then(() => mkdir(`${packageName}/icons`, { recursive: true }))
            .then(() => {
                return Promise.all([
                    copyIfNotExists("template/views/tsconfig.template.json", `${packageName}/views/tsconfig.json`).then(([copied, src, dest]) => {
                        copied ? this.logger.write(`Copied ${src} to ${dest}\n`) : this.logger.write(`${dest} already exists\n`);
                    }),
                    copyIfNotExists(NODE_ICON, `${packageName}/icons/`).then(([copied, src, dest]) => {
                        copied ? this.logger.write(`Copied ${src} to ${dest}\n`) : this.logger.write(`${dest} already exists\n`);
                    }),
                ]);
            })
            .then(() => mkdir(`${packageName}/locales/en-US`, { recursive: true }))
            .then(() => readNodeTemplates())
            .then((templates) => templateReplaceAll(templates, { nodeName, packageName, nodeClass }))
            .then((generated) => templateWriteAll(generated));
    }
}
