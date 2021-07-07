# midgard-yarn-strict

midgard-yarn-strict is a fork of [midgard-yarn](https://www.npmjs.com/package/midgard-yarn), which is itself a fork of [yarn v1](https://www.npmjs.com/package/yarn).

## Improvements over yarn

- midgard-yarn improves reliability and performance of yarn for large repositories.

- midgard-yarn-strict adds strictness, which is necessary for a more deterministic package installations.

- Scoping, midgard-yarn-strict can install only the dependencies of a subset of the workspaces. (eg. `npx midgard-yarn-strict "build-tools-*"` will only install the dependencies needed by the workspaces with name starting by "build-tools-")

## Usage

### Install

Instead of `yarn install`, run

```
$ npx midgard-yarn-strict
```

The installation flags supported by yarn are not supported by the CLI but some are still supported via the yarn config file.

### Upgrade or add a dependency

Manual edits to the package.json files is the only current supported way to manage dependencies, no CLI tool is available yet.

### yarn link

Not supported (yet).

### yarn run

The yarn-run command is not affected by midgard-yarn-strict, so you can still run `yarn test` for example.

## Strictness

Strictness means that workspaces can only use the dependencies that they declare in their `package.json`. This makes the dependency management processes more predictable.

## Configuration

`midgard-yarn-strict` allows you to declare dependencies on behalf of external packages, this is useful when external packages forgot to declare all their dependencies.

Example: package.json
```javascript
{
  // rest of package.json
  "extraDependencies": {
    "webpack": {
      "^4.0.0": {
        "dependencies": {
          "webpack-cli": "^4.0.0"
        }
      }
    }
  }
}
```


## Long term

This package is meant as a stopgap solution while waiting for npm to support strictness.

## Prior art

This package manager is built on the learnings brought by npm, yarn and pnpm.
