#!/usr/bin/env node
const { spawn } = require("child_process");
const { readFile, mkdir, copyIfNotExists } = require("./generate/fs_helpers");
const { readPackageTemplates, readNodeTemplates, templateReplaceAll, templateWriteAll, writeJson } = require("./generate/template_helpers");
const { parseArgs } = require("./generate/parse_args");

function printHelp() {
    console.log(`
    ./generate.js command [subcommand] [options]

    generate
        packageJson -name <packageName> -maintainer "Your Name <your@email.com>" \
            [-githubUsername <username>] [-fullPackageName <node-red-contrib-packagename>]
            Generates package.json and tsconfig.json. You should only have to run this once when
            setting up a new repo.
            -name: Basic package name, e.g. "fancy-http"
            -maintainer: Name/Email combo for package.json
            -githubUsername: Github username, assuming repo is username/fullPackageName.
                Defaults to the username part of your maintainer email address.
            -fullPackageName: full npm package name.
                Defaults to "node-red-contrib-<name>"
        node -name <nodeName> [-packageName <packageName>]
            Generate a new node from templates and update package.json
            -name: Name of your node, e.g. "input"
            -packageName: Name of your package, used to prefix the node.
                Defaults to the packageName stored in package.json.
    Examples:
        # Initialize a new repo
        ./generate.js generate packageJson -name "fancy-http" -maintainer "Your Name <your@email.com>"

        # Create a node fancy-http-input
        ./generate.js generate node -name "input"

`);
}

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
                    printHelp();
                    console.log("Invalid subcommand ", subcommand);
                    break;
            }
            break;
        default:
            printHelp();
            if (command) console.log("Invalid command ", command);
            break;
    }
    return Promise.resolve();
}

main().catch((err) => {
    printHelp();
    if (err) console.error(err);
});

function _npmInstall() {
    console.log("Running npm install...");
    return new Promise((resolve, reject) => {
        spawn("npm", ["i"], {
            stdio: "inherit"
        }).on("close", (code) => {
            code == 0 ? resolve() : reject(code);
        });
    }).then(() => {
        console.log("Done.");
    });
}

function generatePkgJson(packageName, maintainer, githubUsername, fullPackageName) {
    if (!packageName || !maintainer) {
        return Promise.reject(`
        You must provide a name and maintainer!
        e.g. ./generate.js generate packageJson -name fancy-http -maintainer "My Name <your@email.com>"\n`
        );
        return Promise.reject();
    }

    console.log("Generating package.json...");
    githubUsername = githubUsername || maintainer.match(/<([^>]+)@[^>]*>/)[1];
    fullPackageName = fullPackageName || `node-red-contrib-${packageName}`;

    return readPackageTemplates()
    .then((templates) => templateReplaceAll(templates, { packageName, maintainer, githubUsername, fullPackageName }))
    .then((generated) => templateWriteAll(generated))
    .then(() => _npmInstall())
    .then(() => console.log("Done"));
}

function _generateNodeViews(packageName, nodeName) {
    const nodeClass = nodeName.replace(/(?:^|-)([a-z])/g, (m, letter) => letter.toUpperCase());

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
        packageName = packageName || pkgJson.packageName;
        const nodeRed = pkgJson["node-red"] || {};
        nodeRed.nodes = nodeRed.nodes || {};
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