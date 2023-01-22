import { mkdir, readFile } from "fs/promises";
import path from "path";
import NodeGeneratorArgs, { PartialArgs } from "./args/node-generator-args.js";
import { copyIfNotExists } from "./fs_helpers.js";
import { Logger } from "./logger.js";
import Runner from "./runner.js";
import { NODE_ICON, readNodeTemplates, templateReplaceAll, templateWriteAll, writeJson } from "./template-helpers.js";

type PartialPackageJson = {
    packageName?: string
    "node-red"?: {
        nodes?: {
            [fullNodeName: string]: string
        }
    }
}

export default class NodeGenerator implements Runner {
    logger: Logger;
    args: NodeGeneratorArgs;
    constructor(args: string[] | PartialArgs, logger: Logger) {
        this.logger = logger;
        this.args = new NodeGeneratorArgs(args);
    }

    public async run() {
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

    private async getPackageJson(): Promise<PartialPackageJson> {
        return readFile("package.json", "utf8")
            .then((json) => JSON.parse(json)).catch((err) => {
                if (err.code == "ENOENT") {
                    return Promise.reject("Must generate package.json first!");
                } else if (err.code !== undefined) {
                    return Promise.reject(err);
                } else {
                    return Promise.reject("Unable to parse package.json");
                }
            });
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
