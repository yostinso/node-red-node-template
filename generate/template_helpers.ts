import { readFile, writeFile } from "fs/promises";

const NODE_TS_TEMPLATE = "./template/node.ts" as const;
const NODE_VIEW_TS_TEMPLATE = "./template/views/node.ts" as const;
const NODE_HTML_TEMPLATE = "./template/views/node.html" as const;
const NODE_HELP_TEMPLATE = "./template/views/node.help.md" as const;
const LOCALE_TEMPLATE = "./template/locales/en-US/locale.template.json" as const;
const ICONS_FOLDER = "./template/icons" as const;
const NODE_ICON = `${ICONS_FOLDER}/home.svg` as const;

async function readNodeTemplates() {
    return {
        "${packageName}/${packageName}-${nodeName}.ts": await readFile(NODE_TS_TEMPLATE, "utf8"),
        "${packageName}/views/${packageName}-${nodeName}.ts": await readFile(NODE_VIEW_TS_TEMPLATE, "utf8"),
        "${packageName}/views/${packageName}-${nodeName}.html": await readFile(NODE_HTML_TEMPLATE, "utf8"),
        "${packageName}/views/${packageName}-${nodeName}.help.md": await readFile(NODE_HELP_TEMPLATE, "utf8"),
        "${packageName}/locales/en-US/${packageName}-${nodeName}.json": await readFile(LOCALE_TEMPLATE, "utf8"),
    };
}

const PACKAGE_JSON_TEMPLATE = "./package.template.json";
const TSCONFIG_JSON_TEMPLATE = "./tsconfig.template.json";

async function readPackageTemplates() {
    return {
        "package.json": await readFile(PACKAGE_JSON_TEMPLATE, "utf8"),
        "tsconfig.json": await readFile(TSCONFIG_JSON_TEMPLATE, "utf8"),
    };
}

// This is _not_ going to work if you get fancy with templates
function templateReplace(template: string, object: Record<string, string>) {
    let result = template;
    Object.entries(object).forEach(([k, v]) => {
        const repl = new RegExp('\\$\\{' + k + '\\}', "g")
        result = result.replace(repl, v);
    });
    return result;
}

function templateReplaceAll(templates: { [templatePath: string]: string }, object: Record<string, string>): { [templatePath: string]: string } {
    return Object.entries(templates).reduce((tmpl, [name, template]) => {
        const k = templateReplace(name, object),
                v = templateReplace(template, object);
        return  { ...tmpl, [k]: v };
    }, {});
}

function templateWriteAll(generated: { [path: string]: string }) {
    return Promise.all(
        Object.entries(generated).map(([filename, content]) => {
            console.log(`Generated ${filename}`);
            return writeFile(filename, content);
        })
    );
}

function writeJson(filename: string, json: any) {
    return writeFile(filename, JSON.stringify(json, null, 4));
}

export {
    readNodeTemplates, readPackageTemplates, templateReplaceAll, templateWriteAll, writeJson,
    NODE_ICON
}