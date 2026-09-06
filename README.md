<div align="center">

# `@aklinker1/tinybench-report`

[![JSR](https://jsr.io/badges/@aklinker1/tinybench-report)](https://jsr.io/@aklinker1/tinybench-report) [![NPM Version](https://img.shields.io/npm/v/%40aklinker1%2Ftinybench-report?logo=npm&labelColor=red&color=white)](https://www.npmjs.com/package/@aklinker1/tinybench-report) [![Docs](https://img.shields.io/badge/Docs-blue?logo=readme&logoColor=white)](https://jsr.io/@aklinker1/tinybench-report) [![API Reference](https://img.shields.io/badge/API%20Reference-blue?logo=readme&logoColor=white)](https://jsr.io/@aklinker1/tinybench-report/doc) [![License](https://img.shields.io/npm/l/%40aklinker1%2Ftinybench-report)](https://github.com/aklinker1/tinybench-report/blob/main/LICENSE)

Generate custom reports and charts for [`tinybench`](https://github.com/sindresorhus/tinybench) results.

</div>

```sh
bun  add @aklinker1/tinybench-report
deno add @aklinker1/tinybench-report
```

[Example Report &rarr;](https://github.com/aklinker1/tinybench-report/blob/main/scripts/out/example.md)

## Features

- Markdown report
- SVG charts
- Build-your-own report

## Usage

### Markdown Report

```ts
import { MarkdownReport } from "@aklinker1/tinybench-report";
import { Bench } from "tinybench";

// 1. Create a report
const report = new MarkdownReport();


// 2. Add benchmarks to the report
const bench1 = new Bench({ ... });
report.add(bench1);

const bench2 = new Bench({ ... });
report.add(bench2);

// 3. Optional - run any benchmarks that weren't manually ran
await report.run();

// 4. Render and save the report
const files = report.render();
await report.write(".", files);
```

### SVG Chart

```ts
import { renderSvg } from "@aklinker1/tinybench-report/svg";
import { Bench } from "tinybench";

// 1. Create and run your benchmark
const bench1 = new Bench({ ... });
report.add(bench1);

// 2. Render the SVG chart
const svg: string = renderSvg(bench1);

// 3. Save it or do whatever
await writeFile("chart.svg", svg)
```

### Custom Report

```ts
import { Report, ReportOptions, BenchOptions } from "@aklinker1/tinybench-report";

// If you need custom options, add to the basic options
type CustomReportOptions = ReportOptions & {};
type CustomBenchOptions = BenchOptions & {};

class MyReport extends Report<CustomReportOptions, CustomBenchOptions> {
  // ...
}
```

You can implement any functions you want - the markdown report exposes two functions (`render` and `write`), but you can do whatever you want.

- Use `this.benches` to access each bench and it's options
