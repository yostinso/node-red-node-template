const fs = require("fs");


function writeFile(filename, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filename, data, (err) => {
            err ? reject(err) : resolve();
        })
    });
}

function readFile(filename) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, "utf8", (err, data) => {
            err ? reject(err) : resolve(data);
        });
    })
}

function mkdir(path, options = {}) {
    return new Promise((resolve, reject) => {
        fs.mkdir(path, options, (err) => {
            err ? reject(err) : resolve();
        })
    });
}

function writePackageJson(pkgJson) {
    return writeFile("package.json", JSON.stringify(pkgJson, null, 4));
}

module.exports = {
    writeFile, readFile, writePackageJson, mkdir
}