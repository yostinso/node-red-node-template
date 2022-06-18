# Node generator / template for Node-RED

This repository provides a starting point (a generator with templates) for writing custom nodes
for [Node-RED](https://nodered.org/) using TypeScript and ES6 classes instead of bare Javascript.
It also makes an effort to automate away a lot of boilerplate for the packaging up your node, as
well as enabling easy testing with [VSCode Dev Containers](https://code.visualstudio.com/docs/remote/create-dev-container).

See [Why pick me](#why-pick-me) for more of what this particular generator has to offer.

## Make a node
So you want to build a node? It's Super Easy&trade;.

### Dependencies
* Docker (Docker Desktop on Windows is fine, but it must be running in WSL2 mode.)

### Quick start

**Note**: These steps will walk you through creating a basic package called *bobs-iot-devices*. Obviously, change that
to something to better reflect what you want to build. (Don't put *node-red-* in front of the name though except
where specified.)

1. Fork this repo and clone it.  
    `git clone https://github.com/<your-username-here>/<your-repo-here>.git`
    * Name it something to do with the node(s) you're going to create, e.g. `node-red-bobs-iot-devices`.
    * (You don't strictly need to fork if you just want to do local development. If that's the case, just clone this repo directly.)

2. Start up VSCode and open your newly cloned folder.
    * (On Windows, I start with the folder in a WSL window `Command Palette -> Remote-WSL: New WSL Window`.
       I'm not certain that's necessary unless you've cloned the repo in the WSL filesystem, but I tend to do it that way.)

3. Restart in a Dev Container. You may get prompted to do this automatically. If not:  
   `Command Palette -> Remote Containers: Open Workspace in Container` 

* **Here's where the good stuff starts!**

4. Generate the basic `package.json` and `tsconfig.json`.
    ```sh
    ./generate.js generate packageJson -name "bobs-iot-devices" -author "Your Name <your@email.here>"
    ```
    * For more arguments to `./generate.js`, see [Generator syntax](#generator-syntax) or just run `./generate.js`
    with no arguments

5. Generate your first node!
    ```sh
    ./generate.js generate node -name "bobs-sensor"
    ```
    * This will populate a folder `bobs-iot-devices` with `views`, `locales`, and `icons`.
    * If you want to generate another node, just run the command with a second name.

6. Compile everything. You can either do it:
    * via the GUI: `Command Palette -> Run Task -> Compile TS` or 
    * in the terminal: `npm run compile:all`

7. Launch Node-RED!
    * `Run -> Start Debugging`

8. Check out your new node at [http://localhost:1880](http://localhost:1880)! Look for "Some Node" at the bottom of the Node-RED palette.


### Customizing your node

There are a few files that get created for each node that you will want to change to do anything interesting.  
(Replace `bobs-iot-devices` and `bobs-sensor` with your package and node name.)

<style type="text/css">
    DL.files DT { font-weight: normal !important; font-style: normal !important; font-size: medium; !important; font-family: monospace }
    DL.files DD { font-size: medium !important; }
</style>
<dl class="files">
    <dt>bobs-iot-devices/</dt>
    <dd>
        <dl>
            <dt>bobs-iot-devices-bobs-sensor.ts</dt>
            <dd>
                Core node definition. This is where the ES6 class lives that replaces
                the normal <code>.js</code> file. There is some magic at the bottom starting
                with <code>module.exports</code>. <b>Don't touch that part!</b>
                <br/><br/>
                If your node should store more settings than a <code>name</code>, update
                <code>BobsSensorDefaults</code>.
                <br/><br/>
                Everything else is inside the <code>BobsSensor</code> class, and because
                of the fanciness in the ES6 shim that makes this work, you should get
                IntelliSense autocompletion etc. The basic node template that is provided
                includes an example of listening for an incoming message and sending it
                along with the <code>topic</code> updated to <code>Hello World</code>.
            </dd>
            <dt>views/</dt>
            <dd>These files are compiled into the view file (the <code>.html</code> file that is a companion to the <code>.js</code> file.).</dd>
            <dd>
                <dl>
                    <dt>bobs-iot-devices-bobs-sensor.ts</dt>
                    <dd>
                        This is the TypeScript file that is compiled into the view file and
                        initializes the node. This is where you can configure most of the
                        appearance of the node in the Node-RED editor.
                        <br/>
                        Do note the support for localization using the <code>this._</code>
                        function.
                    </dd>
                    <dt>bobs-iot-devices-bobs-sensor.html</dt>
                    <dd>
                        This is the HTML file that renders the node details (the panel shown
                        in the Node-RED editor when you double-click a node.) The template
                        shows a simple example of an input field for changing the node's name.
                        The input field is mapped to the node's <code>name</code> in the
                        node's <code>config</code> object passed to the constructor using
                        the <code>id</code> field, where the format is
                        <code>node-input-&lt;varname&gt;</code>.
                        <br/>
                        Do note the support for localization using the <code>data-i18n</code>
                        attribute.
                    </dd>
                    <dt>bobs-iot-devices-bobs-sensor.help.md</dt>
                    <dd>
                        This is the help file for your node that shows up in the
                        Node-RED editor. See the official <a href="https://nodered.org/docs/creating-nodes/help-style-guide">help style guide</a>.
                        <br/>
                        You can rename this file to end it <code>.html</code> if you'd rather
                        write your help in HTML instead of Markdown. You can delete this file
                        if you don't want to provide help.
                    </dd>
                </dl>
            </dd>
            <dt>locales/en-US/bobs-iot-devices-bobs-sensor.json</dt>
            <dd>
                This is where you can define localization strings used by the
                views. If you want to add additional languages, you'll need to
                create new subfolders, e.g. <code>es-MX</code>.
            </dd>
            <dt>icons</dt>
            <dd>
                This is where you should place any icons. The basic node generator
                will by default copy <code>home.svg</code> which is used by the template
                node. You can also use the <a href="https://nodered.org/docs/creating-nodes/appearance#icon">built-in icons</a>,
                update <code>icon</code> in the <code>views/&lt;node&gt;.ts</code> file,
                and delete this folder or its contents.
            </dd>
        </dl>
    </dd>
</dl>

### Generator syntax
TODO

## Why pick me?
* VSCode Dev Container support:
    * Test locally! Iterate often!
* Full-featured TypeScript support:
    * For both the backend node _and_  the frontend JS.
* Generate and publish a hello world node without writing any code!
* Views rendered from separate HTML, TypeScript, and Markdown/HTML (for help) files so syntax highlighting "just works."
* Template tests! (Coming soon...)
* Watch/auto-build (Coming soon...)