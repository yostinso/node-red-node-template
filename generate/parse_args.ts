function parseArgs(args: string[] = []): Record<string, string> {
    let flag: string | undefined;
    let result: Record<string, string> = {};

    args.forEach((arg) => {
        if (flag === undefined && arg[0] == "-") {
            let match = arg.match(/^-+(.+)/);
            flag = match ? match[1] : undefined;
        } else if (flag !== undefined) {
            result[flag] = arg;
            flag = undefined;
        }
    });
    return result;
}

export default parseArgs;
