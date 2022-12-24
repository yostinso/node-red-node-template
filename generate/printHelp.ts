"use strict";
export function printHelp() {
    console.log(`
    ./generate.js command [subcommand] [options]

    generate <subcommand> <args>
        packageJson -name <packageName> -author "Your Name <your@email.com>" \\
            [-author <username>] [-scope <scopeWithout@>] \\
            [-githubUsername <username>]  [-githubRepo <node-red-packagename>] \\
            [-fullPackageName <@username/node-red-package-name>]

            Generates package.json and tsconfig.json. You should only have to run this once when
            setting up a new repo.

            -name: Basic package name, e.g. "fancy-http"
            -author: Author/maintainer for node package
            -scope: scope for the package.
                Defaults to the username part of the author email address.
            -githubUsername: Github username, used to generate repo path
                Defaults to the username part of your author email address.
            -githubRepo: Github repo name within your Github account
                Defaults to "node-red-<packageName>".
            -fullPackageName: full npm package name.
                Defaults to "@<scope>/node-red-<packageName>".
        node -name <nodeName> [-packageName <packageName>]
            Generate a new node from templates and update package.json
            -name: Name of your node, e.g. "input"
            -packageName: Name of your package, used to prefix the node.
                Defaults to the packageName stored in package.json.
    install
        Install package into /data for local testing & debugging

    Examples:
        # Initialize a new repo
        ./generate.js generate packageJson -name "fancy-http" -author "Your Name <your@email.com>"

        # Create a node fancy-http-input
        ./generate.js generate node -name "input"

`);
}
