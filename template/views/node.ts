import { RED } from "node-red-es6-shim";

type StockIcons = "alert.svg" | "arrow-in.svg" | "bridge-dash.svg" | "bridge.svg" | "db.svg" | "debug.svg" | "envelope.svg" | "feed.svg" | "file.svg" | "function.svg" | "hash.svg" | "inject.svg" | "light.svg" | "serial.svg" | "template.svg" | "white-globe.svg";
type Inputs = { inputs?: 0 | 1; inputLabels: string | (() => string); } | { inputs: number; inputLabels: string[] | (() => string[]); }
type Outputs = { outputs?: 0 | 1; outputLabels: string | (() => string); } | { outputs: number; outputLabels: string[] | (() => string[]); }

type NodeConfig = {
    category?: string;
    color?: string;
    defaults?: object;
    icon: StockIcons | string | (() => string);
    align?: "left" | "right";
    label: string | (() => string);
    paletteLabel: string | (() => string);
    button?: {
        onclick: () => void;
        enabled?: () => boolean;
        visible?: () => boolean;
        toggle?: string;
    }
} & Inputs & Outputs;


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