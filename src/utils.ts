import type { TaskResultCompleted } from "tinybench";

import type { BenchMetric } from "./report";

export const WHATS_BETTER: Record<BenchMetric, "lower" | "higher"> = {
  "latency-avg": "lower",
  "latency-med": "lower",
  "throughput-avg": "higher",
  "throughput-med": "higher",
  samples: "higher",
};

export const METRIC_LABELS: Record<BenchMetric, string> = {
  "latency-avg": "Average latency",
  "latency-med": "Median latency",
  "throughput-avg": "Average throughput",
  "throughput-med": "Median throughput",
  samples: "Number of samples",
};

export function getResultValue(res: TaskResultCompleted, metric: BenchMetric): number {
  if (metric === "latency-avg") return res.latency.mean;
  if (metric === "latency-med") return res.latency.p50;
  if (metric === "throughput-avg") return res.throughput.mean;
  if (metric === "throughput-med") return res.throughput.p50;
  if (metric === "samples") return res.throughput.samplesCount;

  throw Error(`Unknown metric: ${metric}`);
}

/** Returns the number in the form `XXX.YYYeN` */
export function siNumber(n: number): string {
  if (n === 0) return "0";

  const exponent = Math.floor(Math.log10(Math.abs(n)) / 3) * 3;
  const mantissa = n / Math.pow(10, exponent);

  return `${mantissa.toFixed(3)}e${exponent}`;
}

/** Adds commas to large numbers */
export function prettyNumber(n: number): string {
  const str = n.toString();
  const [integer, decimal] = str.split(".") as [string, string | undefined];
  const formatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimal ? `${formatted}.${decimal}` : formatted;
}

export function formatNumber(n: number, metric: BenchMetric): string {
  switch (metric) {
    case "latency-avg":
    case "latency-med":
      if (n < 1) {
        return siNumber(n)
          .replace("e-3", " ms")
          .replace("e-6", " μs")
          .replace("e-9", " ns")
          .replace("e-12", " ps")
          .replace("e-15", " fs");
      } else {
        return prettyNumber(n) + " s";
      }
    case "throughput-avg":
    case "throughput-med":
      if (n < 1) {
        return siNumber(n)
          .replace("e-3", " ops/ms")
          .replace("e-6", " ops/μs")
          .replace("e-9", " ops/ns")
          .replace("e-12", " ops/ps")
          .replace("e-15", " ops/fs");
      } else {
        return prettyNumber(Math.round(n)) + " ops/s";
      }
    case "samples":
      return prettyNumber(n);
  }
}

export function arrayify<T>(t: T | T[] | undefined): T[] {
  return t == null ? [] : Array.isArray(t) ? t : [t];
}
