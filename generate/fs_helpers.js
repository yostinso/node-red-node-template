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


function fileExists(filename) {
    return new Promise((resolve) => {
        fs.stat(filename, (err) => {
            err ? resolve(false) : resolve(true);
        })
    })
}

function copyIfNotExists(src, dest) {
    return new Promise((resolve, reject) => {
        return fileExists(dest).then((exists) => {
            if (exists) { return resolve(false); }
            fs.copyFile(src, dest, (err) => {
                err ? reject(err) : resolve(true);
            });
        })
    })
}

module.exports = {
    writeFile, readFile, mkdir, copyIfNotExists
}