#!/usr/bin/env node
const { spawn } = require("child_process");
const { readFile, writeFile, mkdir, writePackageJson } = require("./generate/fs_helpers");
const { readTemplates, templateReplace } = require("./generate/template_helpers");
const { parseArgs } = require("./generate/parse_args");
const { fstat } = require("fs");

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
    console.log({
        packageName, maintainer, githubUsername, fullPackageName
    });

    return readFile("package.template.json")
    .then((template) => {
        return (() => {
            let pkgJson;
            eval("pkgJson = " + template);
            return pkgJson;
        })();
    }).then((pkgJson) => {
        return writePackageJson(pkgJson);
    }).then(() => {
        console.log("Done.");
    });
}

function _generateNodeViews(packageName, nodeName) {
    return mkdir(`${nodeName}/views`, { recursive: true })
    .then(() => mkdir(`${nodeName}/locales`, { recursive: true }))
    .then(() => {
        return readTemplates();
    }).then((templates) => {
        return Object.entries(templates).reduce((tmpl, [name, template]) => {
            const k = templateReplace(name, { nodeName, packageName }),
                  v = templateReplace(template, { nodeName, packageName });
            return  { ...tmpl, [k]: v };
        }, {});
    }).then((generated) => {
        return Promise.all(
            Object.entries(generated).map(([filename, content]) => {
                return writeFile(filename, content);
            })
        );
    });
}

function generateNode(nodeName, packageName) {
    if (!nodeName) {
        return Promise.reject("Must provide a node name!");
    }
    return readFile("package.json")
    .catch((err) => {
        return Promise.reject(err.code == "ENOENT" ? "Must generate package.json first!" : err);
    })
    .then((json) => {
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
        return writePackageJson(pkgJson);
    }).then(() => {
        return _generateNodeViews(packageName, nodeName);
    });
    // TODO: Generate node.ts, node.html, locale, icon
}