import { EditorRED } from "node-red"
import { EditorConfig } from "node-red-es6-shim";
import { ${nodeClass}Defaults } from "../test-my-node";

declare var RED: EditorRED;
type Config = EditorConfig & { defaults: ${nodeClass}Defaults };

(() => {
    const config: Config = {
        category: "Unknown",
        color: "#b7b7b7",
        defaults: {
            name: { value: "My Node" }
        },
        icon: "home.png",
        align: "left",
        inputs: 1,
        outputs: 1,
        label: function() { return this.name || this._("${packageName}-${nodeName}.node.label"); },
        paletteLabel: function() { return this._("${packageName}-${nodeName}.node.label"); },
        inputLabels: function() { return this._("${packageName}-${nodeName}.node.input"); },
        outputLabels: function() { return this._("${packageName}-${nodeName}.node.output"); },
        button: {
            onclick: function() {
                RED.notify("Button clicked!");
            }
        }
    };

    RED.nodes.registerType("${packageName}-${nodeName}", config);
})();