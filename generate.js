#!/usr/bin/env node
"use strict";
const { spawn } = require("child_process");
const { readFile, mkdir, stat, writeFile } = require("fs/promises");
const { copyIfNotExists } = require("./generate/fs_helpers");
const { readPackageTemplates, readNodeTemplates, templateReplaceAll, templateWriteAll, writeJson, NODE_ICON } = require("./generate/template_helpers");
const { parseArgs } = require("./generate/parse_args");
const { full } = require("acorn-walk");

function printHelp() {
    console.log(`
    ./generate.js command [subcommand] [options]

    generate <subcommand> <args>
        packageJson -name <packageName> -author "Your Name <your@email.com>" \
            [-author <username>] [-scope <scopeWithout@>] \
            [-githubUsername <username>]  [-githubRepo <node-red-packagename>] \
            [-fullPackageName <@username/node-red-package-name>]
            Generates package.json and tsconfig.json. You should only have to run this once when
            setting up a new repo.
            -name: Basic package name, e.g. "fancy-http"
            -author: Author/maintainer for node package
            -scope: scope for the package.
                Defaults to the username part of the author email address.
            -githubUsername: Github username, used to generate repo path
                Defaults to the username part of your author email address.
            -githubRepo: Github repo name within your Github account
                Defaults to "node-red-<packageName>".
            -fullPackageName: full npm package name.
                Defaults to "@<scope>/node-red-<packageName>".
        node -name <nodeName> [-packageName <packageName>]
            Generate a new node from templates and update package.json
            -name: Name of your node, e.g. "input"
            -packageName: Name of your package, used to prefix the node.
                Defaults to the packageName stored in package.json.
    install
        Install package into /data for local testing & debugging

    Examples:
        # Initialize a new repo
        ./generate.js generate packageJson -name "fancy-http" -author "Your Name <your@email.com>"

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
                            author, scope, githubUsername, githubRepo, fullPackageName
                        } = parseArgs(argv);
                        return generatePkgJson(packageName, author, scope, githubUsername, githubRepo, fullPackageName);
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
        case "install":
            install();
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

function generatePkgJson(packageName, author, scope, githubUsername, githubRepo, fullPackageName) {
    if (!packageName || !author) {
        return Promise.reject(`
        You must provide at least a package name and author!
        e.g. ./generate.js generate packageJson -name fancy-http -maintainer "My Name <your@email.com>"\n`
        );
    }

    console.log("Generating package.json...");
    scope = scope || author.match(/<([^>]+)@[^>]*>/)[1];
    if (!scope && !fullPackageName) {
        return Promise.reject(`
        No scope provided, and unable to parse username from the author string.\n`
        );
    }
    githubUsername = githubUsername || author.match(/<([^>]+)@[^>]*>/)[1];
    if (!githubUsername) {
        return Promise.reject(`
        No githubUsername provided and unable to parse it from the author string.\n`
        );
    }
    githubRepo = githubRepo || `node-red-${packageName}`;
    fullPackageName = fullPackageName || `@${scope}/node-red-${packageName}`;

    return readPackageTemplates()
    .then((templates) => templateReplaceAll(templates, { packageName, author, githubUsername, githubRepo, fullPackageName }))
    .then((generated) => templateWriteAll(generated))
    .then(() => _npmInstall())
    .then(() => console.log("Done"));
}

function _generateNodeViews(packageName, nodeName) {
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

function generateNode(nodeName, packageName) {
    if (!nodeName) { return Promise.reject("Must provide a node name!"); }

    return readFile("package.json", "utf8")
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
}

function install() {
    stat("/data/package.json").catch((err) => {
        if (err.code == "ENOENT") {
            // Create stub package.json
            const packageJson = {
                "name": "node-red-project",
                "description": "A Node-RED Project",
                "version": "0.0.1",
                "private": true
            };
            console.log("Creating node-red default package.json on first run.");
            return writeFile("/data/package.json", JSON.stringify(packageJson, null, 4));
        } else {
            return Promise.reject(err);
        }
    }).then(() => {
        return readFile("/data/package.json", "utf8").then(JSON.parse).then((packageJson) => {
            const installed = Object.values(packageJson.dependencies || {}).find((f) => {
                return f == "file:../local_node_modules/node-red-template-node";
            }) !== undefined;
            let packageBuilt = true;
            stat("./package.json").catch((err) => {
                if (err.code == "ENOENT") { packageBuilt = false; } else {
                    return Promise.reject(err);
                }
            }).then(() => {
                if (!installed && packageBuilt) {
                    console.log("Installing symlink to package on first run.");
                    return spawn(
                        "npm", ["i", "/local_node_modules/node-red-template-node/"],
                        {
                            cwd: "/data",
                            stdio: "inherit"
                        }
                    );
                }
            });
        });
    });
}