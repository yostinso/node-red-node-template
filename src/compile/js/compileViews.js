"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const [folder, outDir] = process.argv.slice(2);
const EXTENSIONS = [".html", ".js", ".help.md", ".help.html"];
const INDENT = "  ";
function uniq(arr) {
    return arr.reduce((memo, e) => memo.includes(e) ? memo : [...memo, e], []);
}
async function collectNodeNames(folder) {
    const files = await promises_1.default.readdir(folder, { withFileTypes: true });
    const nodeNames = files.filter((f) => f.isFile() && path_1.default.parse(f.name).ext == ".js");
    const uniqueNames = uniq(nodeNames.map((f) => path_1.default.parse(f.name).name));
    return uniqueNames.reduce((memo, n) => ({ ...memo, [n]: {
            views: [], locales: [], icons: [], logs: []
        } }), {});
}
async function collectViewFiles(nodes, viewsDir) {
    let filename;
    const nodeNames = Object.keys(nodes);
    for (let i in nodeNames) {
        for (let j in EXTENSIONS) {
            filename = path_1.default.join(viewsDir, `${nodeNames[i]}${EXTENSIONS[j]}`);
            try {
                if (await promises_1.default.stat(filename))
                    nodes[nodeNames[i]].views.push(filename);
            }
            catch (err) {
                if (err.code != "ENOENT")
                    throw (err);
            }
        }
    }
    return nodes;
}
function indent(content) {
    const lines = content.toString().split("\n").map((l) => INDENT + l);
    return Buffer.from(lines.join("\n"));
}
async function combineFiles(nodeName, files) {
    let content = "";
    for (let i in files) {
        let file = files[i];
        if (file.endsWith(".js")) {
            content += `<script type="module">\n`;
        }
        else if (file.endsWith(".help.md")) {
            content += `<script type="text/markdown" data-help-name="${nodeName}">\n`;
        }
        else if (file.endsWith(".help.html")) {
            content += `<script type="text/html" data-help-name="${nodeName}">\n`;
        }
        else if (file.endsWith(".html")) {
            content += `<script type="text/x-red" data-template-name="${nodeName}">\n`;
        }
        if (file.endsWith(".md")) {
            // Can't indent markdown without making it act strange
            content += await promises_1.default.readFile(file);
        }
        else {
            content += indent(await promises_1.default.readFile(file));
        }
        content += "\n</script>\n";
    }
    return content;
}
async function renderViews(nodes, viewsDirOut) {
    let content, outFile;
    await promises_1.default.mkdir(viewsDirOut, { recursive: true });
    for (let node in nodes) {
        outFile = path_1.default.join(viewsDirOut, `${node}.html`);
        content = await combineFiles(node, nodes[node].views);
        await promises_1.default.writeFile(outFile, content);
        nodes[node].logs.push(`Rendered ${outFile} from ${JSON.stringify(nodes[node].views)}`);
        //console.log(`Rendered ${outFile} from ${JSON.stringify(nodes[node].views)}`);
    }
    return nodes;
}
async function copyLocales(nodes, localesDir, localesDirOut) {
    let src, dest, localeFile;
    let locality;
    const localities = await promises_1.default.readdir(localesDir, { withFileTypes: true });
    for (let i in localities) {
        if (localities[i].isDirectory()) {
            locality = localities[i].name;
            await promises_1.default.mkdir(path_1.default.join(localesDirOut, locality), { recursive: true });
            for (let node in nodes) {
                localeFile = `${node}.json`;
                src = path_1.default.join(localesDir, locality, localeFile);
                dest = path_1.default.join(localesDirOut, locality, localeFile);
                await promises_1.default.copyFile(src, dest).then(() => {
                    nodes[node].logs.push(`Copied ${src} to ${dest}`);
                    //console.log(`Copied ${src} to ${dest}`);
                    nodes[node].locales.push(localeFile);
                }).catch((err) => {
                    if (err.code != "ENOENT")
                        return Promise.reject(err);
                    nodes[node].logs.push(`No localization file ${src}`);
                    //console.log(`No localization file ${src}`);
                });
            }
        }
    }
    return nodes;
}
async function copyIcons(nodes, iconsDir, iconsDirOut) {
    await promises_1.default.mkdir(path_1.default.join(iconsDirOut), { recursive: true });
    for (let node in nodes) {
        let jsView = nodes[node].views.find((v) => path_1.default.parse(v).ext == ".js");
        if (!jsView)
            continue;
        let js = await promises_1.default.readFile(jsView, "utf8");
        let matched = Array.from(js.matchAll(/"?icon"?\s*:\s*"([^"]+\.(?:png|svg))"/g)).map((m) => m[1]);
        for (let i in matched) {
            let icon = matched[i];
            let src = path_1.default.join(iconsDir, icon);
            let dest = path_1.default.join(iconsDirOut, icon);
            await promises_1.default.copyFile(src, dest).then(() => {
                nodes[node].logs.push(`Copied ${src} to ${dest}`);
                //console.log(`Copied ${src} to ${dest}`);
                nodes[node].icons.push(icon);
            }).catch((err) => {
                if (err.code != "ENOENT")
                    return Promise.reject(err);
                nodes[node].logs.push(`No icon file ${src}`);
                //console.log(`No icon file ${src}`);
            });
        }
    }
    return nodes;
}
async function main() {
    const viewsDir = path_1.default.join(folder, "views");
    const localesDir = path_1.default.join(folder, "locales");
    const localesDirOut = path_1.default.join(outDir, "locales");
    const iconsDir = path_1.default.join(folder, "icons");
    const iconsDirOut = path_1.default.join(outDir, "icons");
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
