const { resolveAndFetch } = require("../../yraf");
const { createDependencyGraph } = require("../../node-dependency-graph");
const fs = require("fs");
const path = require("path");
const { installLocalStore } = require("../../local-package-store");

resolveAndFetch().then(async ({ resolutionMap, locationMap }) => {
  const workspaces = locationMap.filter((n) => n.isLocal).map((n) => n.name);

  locationMap.forEach((o) => {
    if (o.isLocal) {
      o.peerDependencies = undefined;
    }
  });

  locationMap
    .filter((n) => n.isLocal)
    .forEach((n) => {
      const { name, version } = n;
      if (!resolutionMap[name]) {
        resolutionMap[name] = {};
      }
      resolutionMap[name]["*"] = version;
    });

  locationMap.unshift({
    name: "midgard-repo-root",
    version: "1.0.0",
    location: "C:\\tmp\\package.json",
    dependencies: workspaces
      .map((w) => ({ [w]: "*" }))
      .reduce((prev, acc) => ({ ...acc, ...prev }), {}),
  });

  fs.writeFileSync(
    "resolutionMap.json",
    JSON.stringify(resolutionMap, undefined, 2)
  );
  fs.writeFileSync(
    "locationMap.json",
    JSON.stringify(locationMap, undefined, 2)
  );
  const graph = createDependencyGraph(locationMap, resolutionMap, false);

  fs.writeFileSync("graph.json", JSON.stringify(graph, undefined, 2));

  const locationMapMap = new Map();
  const isLocalMap = new Map();
  locationMap.forEach((o) => {
    if (!locationMapMap.get(o.name)) {
      locationMapMap.set(o.name, new Map());
    }
    if (!isLocalMap.get(o.name)) {
      isLocalMap.set(o.name, new Map());
    }
    isLocalMap.get(o.name).set(o.version, o.isLocal);
    locationMapMap
      .get(o.name)
      .set(o.version, o.location.replace(/.package\.json$/, ""));
  });

  await fs.promises.rmdir(".store", { recursive: true });
  await fs.promises.mkdir(".store");

  const newGraph = {
    nodes: await Promise.all(
      graph.nodes.map(async (n) => {
        let bins = undefined;
        const location = locationMapMap.get(n.name).get(n.version);
        const { name } = n;
        const rawManifest =
          name === "midgard-repo-root"
            ? "{}"
            : (
                await fs.promises.readFile(path.join(location, "package.json"))
              ).toString();
        const manifest = JSON.parse(rawManifest);
        if (manifest.bin) {
          if (typeof manifest.bin === "string") {
            const packageNameSplit = name.split("/");
            const binName = packageNameSplit[packageNameSplit.length - 1];
            bins = { [binName]: manifest.bin };
          } else {
            bins = manifest.bin;
          }
        }
        return {
          name: n.name,
          key: n.id.toString(),
          keepInPlace: isLocalMap.get(n.name).get(n.version),
          bins,
          location,
        };
      })
    ),
    links: graph.links.map((l) => ({
      source: l.sourceId.toString(),
      target: l.targetId.toString(),
    })),
  };

  fs.writeFileSync("newGraph.json", JSON.stringify(newGraph, undefined, 2));

  await installLocalStore(newGraph, path.resolve(".store"));
});
