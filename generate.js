#!/usr/bin/env node
const fs = require("fs");
const { spawn } = require("child_process");
const { generateKeyPairSync } = require("crypto");

function parseArgs(args=[]) {
    let flag;
    let result = {
        others: []
    };
    args.forEach((arg) => {
        if (flag === undefined && arg[0] == "-") {
            flag = arg.match(/^-+(.+)/)[1];
        } else if (flag !== undefined) {
            result[flag] = arg;
            flag = undefined;
        } else {
            result.others.push(arg);
        }
    });
    return result;
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

function _writePackageJson(pkgJson) {
    return new Promise((resolve, reject) => {
        fs.writeFile(
            "package.json",
            JSON.stringify(pkgJson, null, 4),
            (err) => {
                if (err) { reject(err) } else { resolve(); }
            }
        );
    });
}

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
    console.log({
        packageName, maintainer, githubUsername, fullPackageName
    });

    return new Promise((resolve, reject) => {
        fs.readFile("package.template.json", "utf8", (err, data) => {
            if (err) { reject(err); } else { resolve(data); }
        });
    }).then((template) => {
        return (() => {
            eval("return " + template);
        })();
    }).then((pkgJson) => {
        return _writePackageJson(pkgJson);
    }).then(() => {
        console.log("Done.");
    });
}

function generateNode(nodeName, packageName) {
    if (!nodeName) {
        return Promise.reject("Must provide a node name!");
    }
    return new Promise((resolve, reject) => {
        fs.readFile("package.json", (err, data) => {
            if (err) {
                if (err.code == "ENOENT") {
                    return reject("Must generate package.json first!")
                } else {
                    return reject(err);
                }
            }
            resolve(data);
        });
    }).then((json) => {
        return JSON.parse(json);
    }).then((pkgJson) => {
        packageName ||= pkgJson.packageName;
        const nodeRed = pkgJson["node-red"] || {};
        nodeRed.nodes ||= {};
        nodeRed.nodes = {
            ...nodeRed.nodes,
            [`${packageName}-${nodeName}`]: `dist/${packageName}-${nodeName}.js`
        };
        pkgJson["node-red"] = nodeRed;
        return pkgJson;
    }).then((pkgJson) => {
        return _writePackageJson(pkgJson);
    });
    // TODO: Generate node.ts, node.html, locale, icon
}