import { mkdir } from "node:fs/promises";
import { writeFile } from "node:fs/promises";
import * as os from "node:os";
import { join } from "node:path";

import type { Bench } from "tinybench";

import {
  Report,
  type BenchMetric,
  type BenchOptions,
  type FileWithContent,
  type ReportOptions,
} from "./report";
import { renderSvg, type RenderSvgOptions } from "./svg";
import { arrayify, METRIC_LABELS } from "./utils";

export type MarkdownReportOptions = ReportOptions & {
  /**
   * Output filename.
   *
   * @default "benchmarks.md"
   */
  file?: string;
  /**
   * Include frontmatter (date & OS info).
   *
   * @default true
   */
  frontmatter?: boolean;
  /** Options passed into `generateSvg` */
  svg?: Omit<RenderSvgOptions, "metric">;
};

export type MarkdownBenchOptions = BenchOptions & {};

/** Generate a MD file and SVG chart for each bench/metric requested. */
export class MarkdownReport extends Report<MarkdownReportOptions, MarkdownBenchOptions> {
  render(): FileWithContent[] {
    const mdFile = this.options?.file ?? "benchmarks.md";
    const md = [
      ...((this.options?.frontmatter ?? true)
        ? [
            [
              `---`,
              `date: ${new Date().toISOString()}`,
              `platform: ${os.platform()}`,
              `arch: ${os.arch()}`,
              `cpu:`,
              ...this.cpus().flatMap((cpu) => [
                `  - model: ${cpu.model}`,
                `    cores: ${cpu.cores}`,
                `    speed: ${cpu.speed / 1000} GHz`,
              ]),
              `memory: ${os.totalmem() / 1e9} GB`,
              `---`,
            ].join("\n"),
          ]
        : []),
      "# Benchmarks",
      ...this.benches.flatMap(({ bench, options }) => [
        `## ${bench.name}`,
        ...arrayify<BenchMetric>(options?.metrics ?? "latency-avg").map(
          (metric) =>
            `![${bench.name} - ${METRIC_LABELS[metric]}](${this.svgFilename(bench, metric)})`,
        ),
      ]),
    ].join("\n\n");

    return [
      { file: mdFile, content: md },
      ...this.benches.flatMap(({ bench, options }) =>
        arrayify<BenchMetric>(options?.metrics ?? "latency-avg").map((metric) => ({
          file: this.svgFilename(bench, metric),
          content: renderSvg(bench, { ...this.options?.svg, metric }),
        })),
      ),
    ];
  }

  async write(dir: string, files: FileWithContent[]): Promise<void> {
    await mkdir(dir, { recursive: true });
    for (const file of files) {
      await writeFile(join(dir, file.file), file.content);
    }
  }

  private svgFilename(bench: Bench, metric: BenchMetric): string {
    if (bench.name == null) throw Error("All benches must have a name");
    return `${bench.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${metric}.svg`;
  }
}
