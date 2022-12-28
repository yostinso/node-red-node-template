"use strict";
import { spawn } from "child_process";
import { Stats } from "fs";
import { readFile, stat, writeFile } from "fs/promises";
import { PackageJson } from "./package-json";

export default class Installer {
    private createPackageJsonIfNotExists(): Promise<void | Stats> {
        return stat("/data/package.json").catch((err) => {
            if (err.code == "ENOENT") {
                // Create stub package.json
                const packageJson = {
                    "name": "node-red-project",
                    "description": "A Node-RED Project",
                    "version": "0.0.1",
                    "private": true
                };
                console.log("Creating node-red default package.json on first run.");
                return writeFile("/data/package.json", JSON.stringify(packageJson, null, 4));
            } else {
                return Promise.reject(err);
            }
        });
    }
    private getPackageJson(): Promise<Partial<PackageJson>> {
        return readFile("/data/package.json", "utf8").then(JSON.parse);
    }

    private isInstalled(packageJson: Partial<PackageJson>): boolean {
        const nodeName = "node-red-template-node"; // TODO Should this be dynamic?
        return Object.values(packageJson.dependencies || {}).find((f) => {
            return f == `file:../local_node_modules/${nodeName}`;
        }) !== undefined;
    }

    private isPackageBuilt(): Promise<boolean> {
        return stat("./package.json")
        .then(() => true)
        .catch((err) => {
            if (err.code == "ENOENT") { return false } else { throw err }
        });
    }

    private installSymlink(): Promise<void> {
        return new Promise((resolve, reject) => {
            const childProcess = spawn(
                "npm", ["i", "/local_node_modules/node-red-template-node/"],
                {
                    cwd: "/data",
                    stdio: "inherit"
                }
            );

            childProcess.on("close", (code) => code == 0 ? resolve() : reject(`Non-zero exit code: ${code}`));
        });
    }

    async install() {
        await this.createPackageJsonIfNotExists();
        const packageJson = await this.getPackageJson();
        const installed = this.isInstalled(packageJson);
        const packageBuilt = await this.isPackageBuilt();

        if (!installed && packageBuilt) {
            console.log("Installing symlink to package on first run.");
            await this.installSymlink();
        }
    }
}
