#!/usr/bin/env node
const { spawn } = require("child_process");
const { readFile, mkdir, copyIfNotExists } = require("./generate/fs_helpers");
const { readPackageTemplates, readNodeTemplates, templateReplaceAll, templateWriteAll, writeJson } = require("./generate/template_helpers");
const { parseArgs } = require("./generate/parse_args");

function main() {
    let [ command, ...argv ] = process.argv.slice(2);
    switch (command) {
        case "generate":
            let subcommand;
            [ subcommand, ...argv ] = argv;
            switch (subcommand) {
                case "packageJson":
                    {
                        let {
                            name: packageName,
                            maintainer, githubUsername,
                            fullPackageName
                        } = parseArgs(argv);
                        return generatePkgJson(packageName, maintainer, githubUsername, fullPackageName);
                    }
                case "node":
                    {
                        let { name: nodeName, packageName } = parseArgs(argv);
                        return generateNode(nodeName, packageName);
                    }
                default:
                    console.log("Invalid subcommand ", subcommand);
                    break;
            }
            break;
        default:
            console.log("Invalid command ", command);
            break;
    }
    return Promise.resolve();
}

main().catch((err) => {
    if (err) { console.error(err); }
});

function generatePkgJson(packageName, maintainer, githubUsername, fullPackageName) {
    if (!packageName || !maintainer) {
        console.warn(`
        You must provide a name and maintainer!
        e.g. ./${process.argv[0]} ${process.argv[1]} mynode "My Name <email@example.com>"\n`
        );
        return Promise.reject();
    }

    console.log("Generating package.json...");
    githubUsername ||= maintainer.match(/<([^>]+)@[^>]*>/)[1];
    fullPackageName ||= `node-red-contrib-${packageName}`;

    return readPackageTemplates()
    .then((templates) => templateReplaceAll(templates, { packageName, maintainer, githubUsername, fullPackageName }))
    .then((generated) => templateWriteAll(generated))
    .then(() => console.log("Done"));
}

function _generateNodeViews(packageName, nodeName) {
    const nodeClass = nodeName.replaceAll(/(?:^|-)([a-z])/g, (m, letter) => letter.toUpperCase());

    return mkdir(`${packageName}/views`, { recursive: true })
    .then(() => {
        return copyIfNotExists("template/views/tsconfig.json", `${packageName}/views/tsconfig.json`).then((copied) => {
            copied ? console.log("Copied views/tsconfig.json") : console.log("views/tsconfig.json already exists");
        });
    })
    .then(() => mkdir(`${packageName}/locales/en-US`, { recursive: true }))
    .then(() => readNodeTemplates())
    .then((templates) => templateReplaceAll(templates, { nodeName, packageName, nodeClass }))
    .then((generated) => templateWriteAll(generated));
}

function generateNode(nodeName, packageName) {
    if (!nodeName) { return Promise.reject("Must provide a node name!"); }

    return readFile("package.json")
    .catch((err) => Promise.reject(err.code == "ENOENT" ? "Must generate package.json first!" : err))
    .then((json) => JSON.parse(json))
    .then((pkgJson) => {
        packageName ||= pkgJson.packageName;
        const nodeRed = pkgJson["node-red"] || {};
        nodeRed.nodes ||= {};
        nodeRed.nodes = {
            ...nodeRed.nodes,
            [`${packageName}-${nodeName}`]: `dist/${packageName}-${nodeName}.js`
        };
        pkgJson["node-red"] = nodeRed;
        return pkgJson;
    })
    .then((pkgJson) => writeJson("package.json", pkgJson))
    .then(() => _generateNodeViews(packageName, nodeName))
    .then(() => console.log("Done"));
    // TODO: Generate icon
}