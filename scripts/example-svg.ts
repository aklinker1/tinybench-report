import { mkdir } from "node:fs/promises";

import { renderSvg } from "../src/svg";
import { bench } from "./fib-bench";

console.log("Running benchmark...");
await bench.run();

console.log("Rendering SVG...");
const svg = renderSvg(bench, {
  metric: "throughput-avg",
  highlightNames: "Iterative",
  labelWidth: 80,
});

await mkdir("scripts/out", { recursive: true });
await Bun.write("scripts/out/example.svg", svg);
console.log("Done!");
