import { resolveAndFetch } from "yraf";
import { createDependencyGraph } from "node-dependency-graph";
import * as fs from "fs";
import * as path from "path";
import { installLocalStore } from "local-package-store";
import type { Graph } from "local-package-store";

async function install(): Promise<void> {
  const { resolutionMap, locationMap } = await resolveAndFetch();
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
      n.isRoot = true;
    });
  const dirs = await fs.promises.readdir(".");
  const oldStores: string[] = dirs.filter((o) => o.startsWith(".store"));
  let newStore = ".store";
  while (oldStores.includes(newStore)) {
    newStore = newStore + "0";
  }

  const graph = createDependencyGraph(locationMap, resolutionMap, false);

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

  await fs.promises.mkdir(newStore);

  const newGraph: Graph = {
    nodes: await Promise.all(
      graph.nodes.map(async (n) => {
        let bins = undefined;
        const location = locationMapMap.get(n.name).get(n.version);
        const { name } = n;
        // TODO: remove midgard assumption here
        const rawManifest = (
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

  await Promise.all([
    installLocalStore(newGraph, path.resolve(newStore), {
      ignoreBinConflicts: true,
      filesToExclude: [".yarn-metadata.json", ".yarn-tarball.tgz"],
    }),
    Promise.all(
      oldStores.map((store) => fs.promises.rmdir(store, { recursive: true }))
    ),
  ]);
}

install().catch((e) => {
  console.error(e);
  process.exit(1);
});
