import NodeRedNode, { EditorConfig } from "node-red-es6-shim";
import * as NodeRed from "node-red";
import util from "util";

type Defaults = EditorConfig["defaults"];

export interface ${nodeClass}Defaults extends Defaults {
    name: { value: string }
}
type ExtendedConfigKeys = {
    [K in keyof ${nodeClass}Defaults]: ${nodeClass}Defaults[K]["value"];
}
export interface ${nodeClass}Config extends NodeRed.NodeDef, ExtendedConfigKeys {}

export class ${nodeClass} extends NodeRedNode {
    private readonly RED: NodeRed.NodeAPI;
    private readonly config: ${nodeClass}Config;
    constructor(node: NodeRed.Node, config: ${nodeClass}Config, RED: NodeRed.NodeAPI) {
        super(node);
        this.config = config;
        this.RED = RED;
    }
}

module.exports = function(RED: NodeRed.NodeAPI) {
    function MakeNode(this: NodeRed.Node, config: ${nodeClass}Config) {
        RED.nodes.createNode(this, config);
        util.inherits(${nodeClass}, this.constructor);
        return new ${nodeClass}(this, config, RED);
    }
    RED.nodes.registerType("${packageName}-${nodeName}", MakeNode);
};

export default module.exports;
module.exports.${nodeClass} = ${nodeClass};