"use strict";
import { readFile, mkdir } from "fs/promises";
import { copyIfNotExists } from "./fs_helpers";
import { readNodeTemplates, templateReplaceAll, templateWriteAll, writeJson, NODE_ICON } from "./template_helpers";
import parseArgs from "./parse_args";

export type NodeGeneratorArgs = {
    nodeName: string
    packageName: string
}

export default class NodeGenerator {
    public async generate(args: Partial<NodeGeneratorArgs>) {
        let { nodeName, packageName } = args;
        if (!nodeName) { return Promise.reject("Must provide a node name!"); }

        let pkgJson = await this.getPackageJson();
        packageName ||= pkgJson.packageName;
        if (!packageName) { return Promise.reject("Must provide a valid package name!"); }

        pkgJson = this.addNodeToPkgJson(packageName, nodeName, pkgJson);

        await writeJson("package.json", pkgJson);
        await this.generateNodeViews(packageName, nodeName);

        console.log("Done");
    }

    private addNodeToPkgJson(packageName: string, nodeName: string, pkgJson: any) {
        let nodeRed = pkgJson["node-red"] || {};
        let nodes = nodeRed.nodes || {};
        nodes = { ...nodes, [`${packageName}-${nodeName}`]: `dist/${packageName}-${nodeName}.js` };
        nodeRed = { ...nodeRed, nodes };
        pkgJson = { ...pkgJson, "node-red": nodeRed };
        return pkgJson;
    }

    private getPackageJson(): Promise<any> {
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

    private parseArgs(argv: string[]): NodeGeneratorArgs {
        let { name: nodeName, packageName } = parseArgs(argv);
        return { packageName, nodeName };
    }
}
