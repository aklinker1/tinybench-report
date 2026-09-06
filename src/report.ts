import * as os from "node:os";

import type { Bench } from "tinybench";

export type FileWithContent = { file: string; content: string };

export type ReportOptions = {
  highlightNames?: string | string[];
};

export type BenchMetric =
  | "latency-avg"
  | "latency-med"
  | "throughput-avg"
  | "throughput-med"
  | "samples";

export type MetricBetter = "lower" | "higher";

export type BenchOptions = {
  /** @default "latency-avg" */
  metrics?: BenchMetric | BenchMetric[];
  /**
   * Default depends on the metric:
   *
   * - "lower" for latency metrics
   * - "higher" for throughput and samples metrics
   */
  better?: MetricBetter;
};

export class Report<TReportOptions extends ReportOptions, TBenchOptions extends BenchOptions> {
  protected benches: Array<{ bench: Bench; options?: TBenchOptions }> = [];

  constructor(protected options?: TReportOptions) {}

  add(bench: Bench, options?: TBenchOptions): void {
    this.benches.push({ bench, options });
  }

  async run(): Promise<void> {
    for (const { bench } of this.benches) {
      if (bench.results.some((res) => res.state === "not-started")) await bench.run();
    }
  }

  /** Returns a summary of the CPUs used by the process. */
  protected cpus(): Array<os.CpuInfo & { cores: number }> {
    return Object.values(
      os.cpus().reduce(
        (map, cpu) => {
          const key = `${cpu.model}-${cpu.speed}`;
          map[key] ??= { ...cpu, cores: 0 };
          map[key].cores++;
          return map;
        },
        {} as Record<string, os.CpuInfo & { cores: number }>,
      ),
    );
  }
}
