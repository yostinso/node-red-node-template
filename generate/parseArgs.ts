export default function parseArgs(args: string[] = []): Record<string, string> {
    let flag: string | undefined;
    const result: Record<string, string> = {};

    args.forEach((arg) => {
        if (flag === undefined && arg[0] == "-") {
            const match = arg.match(/^-+(.+)/);
            flag = match ? match[1] : undefined;
        } else if (flag !== undefined) {
            result[flag] = arg;
            flag = undefined;
        }
    });
    return result;
}