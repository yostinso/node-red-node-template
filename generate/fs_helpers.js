const fs = require("fs");

function fileExists(filename) {
    return fs.promises.stat(filename).then(() => true).catch(() => false);
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
    copyIfNotExists
}