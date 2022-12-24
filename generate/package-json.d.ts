export type PackageJson = {
    name: string
    packageName: string
    version: string
    description: string
    author: string
    homepage: string
    license: string
    contributors: string[]
    maintainers: string[]
    repository: {
        type: string
        url: string
    }
    bugs: {
        url: string
    },
    keywords: string[]
    "node-red": {
        version: string
        nodes: {}
    }
    publishConfig: {
        access: "public" | string
    },
    scripts: Record<string, string>
    devDependencies: Record<string, string>
    dependencies: Record<string, string>
}