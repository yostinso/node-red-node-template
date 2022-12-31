import { statSync } from "fs";
import parseArgs from "../parseArgs";
import { FieldsOfArgs, PartialArgs as GenericPartialArgs, PartialArgsPlus as GenericPartialArgsPlus } from "./PartialArgs";

export type PartialArgs = GenericPartialArgs<NodeGeneratorArgs>
type PartialArgsPlus<K extends keyof NodeGeneratorArgs> = GenericPartialArgsPlus<NodeGeneratorArgs, K>

export default class NodeGeneratorArgs {
    nodeName: string;
    packageName?: string;
    rootPath: string;

    constructor(args: string[] | PartialArgs) {
        if (this.isArgv(args)) { args = this.parseArgs(args) }
        this.validateArgs(args);

        this.nodeName = args.nodeName;
        this.packageName = args.packageName;
        this.rootPath = args.rootPath;
    }

    private parseArgs(argv: string[]): PartialArgs {
        const { name: nodeName, packageName, rootPath } = parseArgs(argv);
        return { nodeName, packageName, rootPath };
    }

    private validateArgs(args: unknown): asserts args is FieldsOfArgs<NodeGeneratorArgs> {
        if (typeof args !== "object" || args === null) {
            throw new Error("Expected an arguments object");
        }
        this.checkNodeName(args);
        this.validateRootPath(args);
    }

    private checkNodeName(args: PartialArgs): asserts args is PartialArgsPlus<"nodeName"> {
        if (!this.isValidArg(args.nodeName)) {
            throw new Error("You must provide at least a node name");
        }
    }

    private validateRootPath(args: PartialArgs): asserts args is PartialArgsPlus<"rootPath"> {
        args.rootPath = args.rootPath || ".";
        if (!this.isValidArg(args.rootPath)) {
            throw new Error("Invalid rootPath provided.");
        }
        const dirStats = statSync(args.rootPath, { throwIfNoEntry: false });
        if (dirStats === undefined) {
            throw new Error("Invalid rootPath provided. Directory not found.");
        }
        if (!dirStats.isDirectory()) {
            throw new Error("Invalid rootPath provided. Must be a directory.");
        }
    }

    private isValidArg(arg: string | null | undefined): arg is string {
        return arg !== undefined && arg !== null && arg.length > 0;
    }

    private isArgv(args: unknown): args is string[] {
        return (
            Array.isArray(args) &&
            args.every((e) => typeof e === "string")
        );
    }
}