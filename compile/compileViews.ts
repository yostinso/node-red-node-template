import { mkdirSync } from "fs";
import fs from "fs/promises";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv)).help("h").alias("h", "help").options({
    outDir: { type: "string", describe: "specify output folder", default: "." },
    locales: { type: "string", require: true, describe: "specify locales folder" }
}).parseSync();

const folders = argv._.map((s) => `${s}`);
const outDir = argv.outDir;
const localesDir = argv.locales;


function getContentPaths(folder: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        fs.readdir(folder, { withFileTypes: true }).then((files) => {
            const basePaths: (Promise<string[]> | string)[] = [];
            files.forEach((dirent) => {
                let filePath = path.join(folder, dirent.name);
                if (dirent.isDirectory()) {
                    basePaths.push(getContentPaths(filePath));
                } else if (dirent.isFile() && dirent.name.endsWith(".html")) {
                    basePaths.push(filePath);
                } else if (dirent.isFile() && dirent.name.endsWith(".js")) {
                    basePaths.push(filePath);
                }
            });
            resolve(Promise.all(basePaths).then((paths) => paths.flat()));
        });
    });
}

const INDENT = "  " as const;
function indent(content: Buffer): Buffer {
    const lines = content.toString().split("\n").map((l) => INDENT + l);
    return Buffer.from(lines.join("\n"));
}

folders.forEach((folder) => {
    getContentPaths(folder).then((contentPaths) => {
        const baseFiles = contentPaths.filter((p) => !path.parse(p).name.includes(".") && path.parse(p).ext == ".html");
        baseFiles.forEach((baseFile) => {
            const baseName = path.parse(baseFile).name;
            const related = contentPaths.filter((p) => path.parse(p).name == baseName && p != baseFile);
            
            const relatedByType = related.reduce((memo, p) => {
                const type = path.parse(p).ext.slice(1);
                return {
                    ...memo,
                    [type]: p
                }
            }, {} as { [type: string]: string });

            const outFile = path.join(
                outDir,
                path.relative(folder, baseFile)
            );


            // Generate combined file
            console.log(`Generating file ${outFile} from ${baseFile} and`, relatedByType);
            mkdirSync(path.parse(outFile).dir, { recursive: true });
            return fs.open(outFile, "w").then((fh) => {
                return new Promise<fs.FileHandle>((resolve, reject) => {
                    Object.entries(relatedByType).map(async ([type, subfile]) => {
                        await fs.readFile(subfile).then(async (content) => {
                            let scriptTag = type == "js" ?
                                `<script type="module">\n` : 
                                `<script type="text/x-red" data-template-name="${baseName}">\n`;
                            await fh.write(scriptTag).then(() => {
                                return fh.write(indent(content));
                            }).then(() => {
                                return fh.write("\n</script>\n");
                            });
                        });
                        resolve(fh);
                    });
                })
            }).then(async (fh) => {
                await fs.readFile(baseFile).then(async (content) => {
                    await fh.write(`<script type="text/x-red" data-template-name="${baseName}">\n`).then(() => {
                        fh.write(indent(content))
                    }).then(() => {
                        return fh.write("\n</script>\n");
                    });
                });
                return fh;
            }).then(() => {
                // Copy locales
                return fs.readdir(localesDir, { withFileTypes: true }).then((langDirs) => {
                    const languages = langDirs.map((langDir) => {
                        if (langDir.isDirectory()) {
                            return fs.readdir(path.join(localesDir, langDir.name), { withFileTypes: true }).then((langFiles) => {
                                return langFiles.filter((langFile) => path.parse(langFile.name).name == baseName).map((langFile) => {
                                    return path.join(localesDir, langDir.name, langFile.name);
                                });
                            });
                        } else {
                            return [];
                        }
                    });
                    return Promise.all(languages).then((files) => files.flat());
                }).then((localeFiles) => {
                    console.log(`  with locales`, localeFiles);
                    const promises = localeFiles.map((localeFile) => {
                        const relPath = path.parse(path.relative(localesDir, localeFile));
                        const newPath = path.join(outDir, "locales", relPath.dir, relPath.base);
                        return fs.mkdir(path.join(outDir, "locales", relPath.dir), { recursive: true }).then(() => {
                            return fs.copyFile(localeFile, newPath);
                        });
                    })
                    return Promise.all(promises);
                });
            })
        })
    })
})