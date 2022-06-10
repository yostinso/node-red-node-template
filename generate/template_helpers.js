const { readFile, writeFile } = require("./fs_helpers");

const NODE_TS_TEMPLATE = "./template/node.ts";
const NODE_VIEW_TS_TEMPLATE = "./template/views/node.ts";
const NODE_HTML_TEMPLATE = "./template/views/node.html";
const LOCALE_TEMPLATE = "./template/locales/locale.template.json";
const ICONS_FOLDER = "./template/icons";

function readNodeTemplates() { 
    return readFile(NODE_TS_TEMPLATE).then((nodeTsTemplate) => {
        return {
            "${packageName}/${packageName}-${nodeName}.ts": nodeTsTemplate
        };
    }).then((t) => {
        return readFile(NODE_VIEW_TS_TEMPLATE).then((nodeViewTsTemplate) => {
            return {
                ...t,
                "${packageName}/views/${packageName}-${nodeName}.ts": nodeViewTsTemplate
            };
        });
    }).then((t) => {
        return readFile(NODE_HTML_TEMPLATE).then((nodeHtmlTemplate) => {
            return {
                ...t,
                "${packageName}/views/${packageName}-${nodeName}.html": nodeHtmlTemplate
            };
        });
    }).then((t) => {
        return readFile(LOCALE_TEMPLATE).then((localeTemplate) => {
            return {
                ...t, 
                "${packageName}/locales/${packageName}-${nodeName}.json": localeTemplate
            };
        });
    });
}

const PACKAGE_JSON_TEMPLATE = "./package.template.json";
const TSCONFIG_JSON_TEMPLATE = "./tsconfig.template.json";

function readPackageTemplates() {
    return readFile(PACKAGE_JSON_TEMPLATE).then((packageJsonTemplate) => {
        return {
            "package.json": packageJsonTemplate
        };
    }).then((t) => {
        return readFile(TSCONFIG_JSON_TEMPLATE).then((tsconfigJsonTemplate) => {
            return {
                ...t,
                "tsconfig.json": tsconfigJsonTemplate
            };
        });
    });
}

// This is _not_ going to work if you get fancy with templates
function templateReplace(template, object) {
    let result = template;
    Object.entries(object).forEach(([k, v]) => {
        const repl = "${" + k + "}";
        result = result.replaceAll(repl, v);
    });
    return result;
}

function templateReplaceAll(templates, object) {
    return Object.entries(templates).reduce((tmpl, [name, template]) => {
        const k = templateReplace(name, object),
                v = templateReplace(template, object);
        return  { ...tmpl, [k]: v };
    }, {});
}

function templateWriteAll(generated) {
    return Promise.all(
        Object.entries(generated).map(([filename, content]) => {
            console.log(`Generated ${filename}`);
            return writeFile(filename, content);
        })
    );
}

function writeJson(filename, json) {
    return writeFile(filename, JSON.stringify(json, null, 4));
}

module.exports = {
    readNodeTemplates, readPackageTemplates, templateReplaceAll, templateWriteAll, writeJson
};