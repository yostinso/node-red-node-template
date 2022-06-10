import { RED } from "node-red-es6-shim";
import { NodeConfig } from "node-red-es6-shim";

(() => {
    const config: NodeConfig = {
        category: "Unknown",
        color: "#b7b7b7",
        defaults: {
            name: "My Node"
        },
        icon: "home.png",
        align: "left",
        inputs: 1,
        outputs: 1,
        label: function() { return this.name || this._("${packageName}-${nodeName}.node.label"); },
        paletteLabel: function() { return this._("${packageName}-${nodeName}.node.label"); },
        inputLabels: function() { return [ this._("${packageName}-${nodeName}.node.input") ]; },
        outputLabels: function() { return [ this._("${packageName}-${nodeName}.node.output") ]; },
        button: {
            onclick: function() {
                this.send({ payload: "hello world" })
            }
        }
    };

    RED.nodes.registerType("${packageName}-${nodeName}");
})();