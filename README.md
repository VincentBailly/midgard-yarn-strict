# midgard-yarn-strict

midgard-yarn-strict is a fork of [midgard-yarn](https://www.npmjs.com/package/midgard-yarn), which is itself a fork of [yarn v1](https://www.npmjs.com/package/yarn).

## Improvments over yarn

- midgard-yarn improves reliability and performance of yarn for large repositories.

- midgard-yarn-strict adds strictness, which is necessary for a more deterministic package installations.

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

## Long term

This package is meant as a stopgap solution while waiting for npm to support strictness.

## Prior art

This package manager is built on the learnings brought by npm, yarn and pnpm.
