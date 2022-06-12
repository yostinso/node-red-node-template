const fs = require("fs");
const path = require("path");

function copyIfNotExists(src, dest) {
    return fs.promises.opendir(dest).then((dir) => {
        // Need to figure out full path
        dest = path.join(dir.path, path.basename(src));
    }).catch(() => true)
    .then(() => fs.promises.copyFile(src, dest, fs.constants.COPYFILE_EXCL).then(() => true).catch((err) => {
        if (err.code == "EEXIST") { return false; }
        return Promise.reject(err);
    })).then((copied) => {
        return [ copied, src, dest ];
    });
}

module.exports = {
    copyIfNotExists
}