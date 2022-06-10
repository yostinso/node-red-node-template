function parseArgs(args = []) {
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
exports.parseArgs = parseArgs;
