import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: [ "src/**/__tests__/*.ts" ],
        deps: {
            inline: [ "@yostinso/vitest-matchjsonobject"]
        }
    }
});