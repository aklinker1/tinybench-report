import { MarkdownReport } from "../src/markdown";
import { bench } from "./fib-bench";

const report = new MarkdownReport({
  file: "example.md",
});
report.add(bench, {
  metrics: ["throughput-avg", "samples"],
});
report.add(bench);

console.log("Running benchmarks...");
await report.run();

console.log("Writing report...");
const files = report.render();
await report.write("scripts/out", files);

console.log("Done");
