import fs from "fs/promises";
import path from "path";

const [ folder, outDir ] = process.argv.slice(2);

const EXTENSIONS = [ ".html", ".js" ];
const INDENT = "  " as const;

type NodeMetadata = {
    [node: string]: {
        views: string[];
        locales: string[];
        icons: string[];
        logs: string[];
    }
}

function uniq<T extends any[]>(arr: T): T {
    return arr.reduce((memo, e) => memo.includes(e) ? memo : [ ...memo, e ], []);
}
async function collectNodeNames(folder: string): Promise<NodeMetadata> {
    const files = await fs.readdir(folder, { withFileTypes: true });
    const nodeNames = files.filter((f) => f.isFile() && path.parse(f.name).ext == ".js");
    const uniqueNames = uniq(nodeNames.map((f) => path.parse(f.name).name));
    return uniqueNames.reduce((memo, n) => ({ ...memo, [n]: {
        views: [], locales: [], icons: [], logs: []
    } }), {});
}

async function collectViewFiles(nodes: NodeMetadata, viewsDir: string): Promise<NodeMetadata> {
    let filename;
    const nodeNames = Object.keys(nodes);
    for (let i in nodeNames) {
        for (let j in EXTENSIONS) {
            filename = path.join(viewsDir, `${nodeNames[i]}${EXTENSIONS[j]}`);
            try {
                if (await fs.stat(filename)) nodes[nodeNames[i]].views.push(filename);
            } catch (err: any) {
                if (err.code != "ENOENT") throw(err);
            }
        }
    }
    return nodes;
}

function indent(content: Buffer): Buffer {
    const lines = content.toString().split("\n").map((l) => INDENT + l);
    return Buffer.from(lines.join("\n"));
}
async function combineFiles(nodeName: string, files: string[]): Promise<string> {
    
    let type, header, content = "";
    for (let i in files) {
        type = path.parse(files[i]).ext;
        header = type == ".js" ?
            `<script type="module">\n` :
            `<script type="text/x-red" data-template-name="${nodeName}">\n`;
        content +=
            header +
            indent(await fs.readFile(files[i])) +
            "\n</script>\n";
    }
    return content;
}

async function renderViews(nodes: NodeMetadata, viewsDirOut: string)  {
    let content, outFile;

    await fs.mkdir(viewsDirOut, { recursive: true });

    for (let node in nodes) {
        outFile = path.join(viewsDirOut, `${node}.html`);
        content = await combineFiles(node, nodes[node].views);
        await fs.writeFile(outFile, content);
        nodes[node].logs.push(`Rendered ${outFile} from ${JSON.stringify(nodes[node].views)}`);
        //console.log(`Rendered ${outFile} from ${JSON.stringify(nodes[node].views)}`);
    }
    return nodes;
}
async function copyLocales(nodes: NodeMetadata, localesDir: string, localesDirOut: string) {

    let src: string, dest: string, localeFile: string;
    let locality;

    const localities = await fs.readdir(localesDir, { withFileTypes: true });
    for (let i in localities) {
        if (localities[i].isDirectory()) {
            locality = localities[i].name;
            await fs.mkdir(path.join(localesDirOut, locality), { recursive: true });

            for (let node in nodes) {
                localeFile = `${node}.json`;
                src = path.join(localesDir, locality, localeFile);
                dest = path.join(localesDirOut, locality, localeFile);

                await fs.copyFile(src, dest).then(() => {
                    nodes[node].logs.push(`Copied ${src} to ${dest}`);
                    //console.log(`Copied ${src} to ${dest}`);
                    nodes[node].locales.push(localeFile);
                }).catch((err) => {
                    if (err.code != "ENOENT") return Promise.reject(err);
                    nodes[node].logs.push(`No localization file ${src}`);
                    //console.log(`No localization file ${src}`);
                });
            }
        }
    }
    return nodes;
}

async function copyIcons(nodes: NodeMetadata, iconsDir: string, iconsDirOut: string) {
    await fs.mkdir(path.join(iconsDirOut), { recursive: true });
    for (let node in nodes) {
        let jsView = nodes[node].views.find((v) => path.parse(v).ext == ".js");
        if (!jsView) continue;
        let js = await fs.readFile(jsView, "utf8");
        let matched = Array.from(js.matchAll(/"?icon"?\s*:\s*"([^"]+\.(?:png|svg))"/g)).map((m) => m[1]);

        for (let i in matched) {
            let icon = matched[i];
            let src = path.join(iconsDir, icon);
            let dest = path.join(iconsDirOut, icon);
            await fs.copyFile(src, dest).then(() => {
                nodes[node].logs.push(`Copied ${src} to ${dest}`);
                //console.log(`Copied ${src} to ${dest}`);
                nodes[node].icons.push(icon);
            }).catch((err) => {
                if (err.code != "ENOENT") return Promise.reject(err);
                nodes[node].logs.push(`No icon file ${src}`);
                //console.log(`No icon file ${src}`);
            });
        }
    }
    return nodes;
}

async function main() {
    const viewsDir = path.join(folder, "views");

    const localesDir = path.join(folder, "locales", );
    const localesDirOut = path.join(outDir, "locales");

    const iconsDir = path.join(folder, "icons");
    const iconsDirOut = path.join(outDir, "icons");

    return collectNodeNames(folder)
    .then((nodes) => copyLocales(nodes, localesDir, localesDirOut))
    .then((nodes) => collectViewFiles(nodes, viewsDir))
    .then((nodes) => renderViews(nodes, outDir))
    .then((nodes) => copyIcons(nodes, iconsDir, iconsDirOut))
    .then((nodes) => {
        for (let node in nodes) {
            console.log(node);
            console.log(nodes[node].logs.map((l) => INDENT + l).join("\n"));
            console.log("");
        }
    })
    .catch((err) => console.error(err));
}

main();