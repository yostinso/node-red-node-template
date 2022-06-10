const { readFile } = require("./fs_helpers");

const NODE_TS_TEMPLATE = "./template/views/node.ts";
const NODE_HTML_TEMPLATE = "./template/views/node.html";
const LOCALE_TEMPLATE = "./template/locales/locale.template.json";
const ICONS_FOLDER = "./template/icons";

function readTemplates() { 
    return readFile(NODE_TS_TEMPLATE).then((nodeTsTemplate) => {
        return {
            "${nodeName}/views/${packageName}-${nodeName}.ts": nodeTsTemplate
        };
    }).then((t) => {
        return readFile(NODE_HTML_TEMPLATE).then((nodeHtmlTemplate) => {
            return {
                ...t,
                "${nodeName}/views/${packageName}-${nodeName}.html": nodeHtmlTemplate
            };
        });
    }).then((t) => {
        return readFile(LOCALE_TEMPLATE).then((localeTemplate) => {
            return {
                ...t, 
                "${nodeName}/locales/${packageName}-${nodeName}.json": localeTemplate
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

module.exports = {
    readTemplates, templateReplace
};