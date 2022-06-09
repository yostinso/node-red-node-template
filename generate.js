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
                    let {
                        name: packageName,
                        maintainer, githubUsername,
                        fullPackageName
                    } = parseArgs(argv);
                    return generatePkgJson(packageName, maintainer, githubUsername, fullPackageName);
                case "generateNode":
                    let { name: nodeName, }
            }
            break;
    }
    return Promise.resolve();
}

main().catch((err) => {
    if (err) { console.err(err); }
});

function generatePkgJson(packageName, maintainer, githubUsername, fullPackageName) {
    if (!packageName || !maintainer) {
        console.warn(`
        You must provide a name and maintainer!
        e.g. ./${process.argv[0]} ${process.argv[1]} mynode "My Name <email@example.com>"
    `
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
        let pkgJson;
        eval("pkgJson=" + template);
        return pkgJson;
    }).then((pkgJson) => {
        return new Promise((resolve, reject) => {
            fs.writeFile(
                "package.json",
                JSON.stringify(pkgJson, null, 4),
                (err) => {
                    if (err) { reject(err) } else { resolve(); }
                }
            );
        });
    }).then(() => {
        console.log("Done.");
    });
}

function generateNode() {

}

/*
console.log("Generating package.json...");
generatePkgJson().then(() => {
    console.log("Done");
}).then(() => {
    console.log("Installing modules");
    console.log("vvvvvvvvvvvvvvvvvvvvvvvvvv");
    return new Promise((resolve, reject) => {
        spawn("npm", ["i", "--color", "always"], {
            stdio: "inherit"
        }).on("close", (code) => {
            if (code == 0) { resolve(); } else { reject(code); }
        });
    }).then(() => {
        console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^");
    });
})
.then(() => {
    generateNode(nodeName)
})
.then(() => {
    console.log("Done");
});
*/