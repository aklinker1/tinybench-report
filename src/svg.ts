import type { Bench, TaskResultCompleted } from "tinybench";

import type { BenchMetric, MetricBetter } from "./report";
import { arrayify, formatNumber, getResultValue, METRIC_LABELS, WHATS_BETTER } from "./utils";

export type SvgColors = {
  base: `#${string}`;
  baseContent: `#${string}`;
  accent: `#${string}`;
  accentContent: `#${string}`;
};

const DEFAULT_COLORS: SvgColors = {
  base: "#ffffff",
  baseContent: "#000000",
  accent: "#0077b6",
  accentContent: "#ffffff",
};

export type RenderSvgOptions = {
  metric: BenchMetric;
  better?: MetricBetter;
  highlightNames?: string | string[];
  colors?: SvgColors;
  width?: number;
  padding?: number;
  labelWidth?: number;
  gap?: number;
};

export function renderSvg(bench: Bench, options: RenderSvgOptions): string {
  if (bench.results.length === 0) throw Error("No results to render");

  const better = options.better ?? WHATS_BETTER[options.metric];
  const items = bench.tasks
    .map((task, i) => ({
      task,
      result: bench.results[i] as TaskResultCompleted,
    }))
    .map((item) => ({ ...item, value: getResultValue(item.result, options.metric) }))
    .toSorted(better === "lower" ? (a, b) => a.value - b.value : (a, b) => b.value - a.value);

  const values = items.map((x) => x.value);
  const maxValue = Math.max(...values);

  const colors = options.colors ?? DEFAULT_COLORS;
  const highlightNames = arrayify(options.highlightNames ?? []);
  const width = options.width ?? 700;
  const padding = options.padding ?? 16;
  const gap = options.gap ?? 16;
  const labelWidth = options.labelWidth ?? 64;
  const barSize = 32;
  const axisWidth = 1;
  const titleSize = 24;
  const titleMarginBottom = 8;
  const subtitleSize = 16;
  const labelSize = 12;
  const chartHeight = (items.length + 1) * gap + items.length * barSize;
  const height =
    2 * padding + titleSize + titleMarginBottom + subtitleSize + gap + axisWidth + chartHeight;
  const labelThreshold = 0.3;

  const bounds = new Rectangle(0, 0, width, height);
  const title = bounds.copyPadded(padding).copyTopAligned(titleSize);
  const subtitle = title.copyBelow(titleMarginBottom).copyBelow(subtitleSize);

  const axisTop = subtitle.bottom + gap;
  const chartTop = axisTop + axisWidth;
  const labelsContainer = new Rectangle(padding, chartTop, labelWidth, chartHeight);
  const verticalAxis = labelsContainer.copyRight(gap).copyRight(axisWidth);
  const chartContainer = verticalAxis
    .copyRight(gap)
    .copyRight(0)
    .copyBounds({ right: bounds.right - padding });
  const horizontalAxis = Rectangle.fromBounds(
    verticalAxis.left,
    chartContainer.right,
    axisTop,
    axisTop + axisWidth,
  );

  const labels = bench.results.map(
    (_, i) =>
      new Rectangle(
        labelsContainer.left,
        labelsContainer.top + i * barSize + (i + 1) * gap,
        labelWidth,
        barSize,
      ),
  );
  const bars = bench.results.map(
    (_, i) =>
      new Rectangle(
        chartContainer.left,
        chartTop + i * barSize + (i + 1) * gap,
        chartContainer.width * (values[i]! / maxValue),
        barSize,
      ),
  );

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${bounds.right} ${bounds.bottom}" font-family="sans-serif">`,
    `  ${bounds.svgRect(colors.base)}`,
    `  ${title.svgText(bench.name ?? "Unnamed", { fontSize: titleSize, color: colors.baseContent, fontWeight: "bold" })}`,
    `  ${subtitle.svgText(`${METRIC_LABELS[options.metric]}${better === "lower" ? ", lower = better" : ""}`, { fontSize: subtitleSize, color: colors.baseContent + "A0" })}`,
    `  ${horizontalAxis.svgRect(colors.baseContent)}`,
    `  ${verticalAxis.svgRect(colors.baseContent)}`,
    ...labels.map((l, i) => {
      const name = items[i]!.task.name;
      const highlighted = highlightNames.includes(name);
      return (
        "  " +
        l.svgText(`${name} ${metals[i] ?? ""}`, {
          fontSize: labelSize,
          color: highlighted ? colors.baseContent : colors.baseContent,
          verticalAlign: "center",
          horizontalAlign: "right",
          fontWeight: highlighted ? "bold" : undefined,
        })
      );
    }),
    ...bars.map((l) => "  " + l.svgRect(colors.accent, { rounded: barSize / 8 })),
    ...bars.map((l, i) => {
      const isLeft = items[i]!.value / maxValue >= labelThreshold;
      const space = (barSize - labelSize) / 2;
      return (
        "  " +
        (isLeft ? l.copyLeftAligned(l.width - space) : l.copyRight(space).copyRight(0)).svgText(
          formatNumber(items[i]!.value, options.metric),
          {
            fontSize: labelSize,
            color: isLeft ? colors.accentContent : colors.baseContent,
            horizontalAlign: isLeft ? "right" : "left",
            verticalAlign: "center",
            fontWeight: "bold",
          },
        )
      );
    }),
    `</svg>`,
  ].join("\n");
}

type Point = [x: number, y: number];

class Rectangle {
  static fromPoints(p1: Point, p2: Point): Rectangle {
    return new Rectangle(
      Math.min(p1[0], p2[0]),
      Math.min(p1[1], p2[1]),
      Math.abs(p1[0] - p2[0]),
      Math.abs(p1[1] - p2[1]),
    );
  }

  static fromBounds(left: number, right: number, top: number, bottom: number): Rectangle {
    return new Rectangle(left, top, Math.abs(left - right), Math.abs(top - bottom));
  }

  constructor(
    public left: number,
    public top: number,
    public width: number,
    public height: number,
  ) {}

  get right(): number {
    return this.left + this.width;
  }
  set right(value: number) {
    this.width = value - this.left;
  }

  get bottom(): number {
    return this.top + this.height;
  }
  set bottom(value: number) {
    this.height = value - this.top;
  }

  get p1(): Point {
    return [this.left, this.top];
  }

  get p2(): Point {
    return [this.right, this.bottom];
  }

  copy(override: { left?: number; top?: number; width?: number; height?: number }): Rectangle {
    return new Rectangle(
      override?.left ?? this.left,
      override?.top ?? this.top,
      override?.width ?? this.width,
      override?.height ?? this.height,
    );
  }

  debug() {
    return {
      left: this.left,
      right: this.right,
      top: this.top,
      bottom: this.bottom,
      width: this.width,
      height: this.height,
    };
  }

  copyBounds(override: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  }): Rectangle {
    return Rectangle.fromBounds(
      override.left ?? this.left,
      override.right ?? this.right,
      override.top ?? this.top,
      override.bottom ?? this.bottom,
    );
  }

  copyPoints(override: { p1?: Point; p2?: Point }): Rectangle {
    return Rectangle.fromPoints(override.p1 ?? this.p1, override.p2 ?? this.p2);
  }

  /**
   * ```plain
   * ┌────────┐    ┌╌╌╌╌╌╌╌╌┐
   * │        │ -> ┆  ┌──┐  ┆
   * │        │    ┆  └──┘  ┆
   * └────────┘    └╌╌╌╌╌╌╌╌┘
   * ```
   */
  copyPadded(padding: number): Rectangle {
    return this.copy({
      left: this.left + padding,
      top: this.top + padding,
      width: this.width - 2 * padding,
      height: this.height - 2 * padding,
    });
  }

  /**
   * ```plain
   * ┌───┐    ┌╌╌╌┐
   * │   │ -> ┆   ┆
   * └───┘    ┌───┐
   *          │   │
   *          └───┘
   * ```
   */
  copyBelow(height: number): Rectangle {
    return this.copy({ top: this.bottom, height });
  }

  /**
   * ```plain
   * ┌───┐    ┌╌╌╌┌────┐
   * │   │ -> ┆   │    │
   * └───┘    └╌╌╌└────┘
   * ```
   */
  copyRight(width: number): Rectangle {
    return this.copy({ left: this.right, width });
  }

  /**
   * ```plain
   * ┌──────┐    ┌──┐╌╌╌┐
   * │      │ -> │  │   ┆
   * │      │    │  │   ┆
   * └──────┘    └──┘╌╌╌┘
   * ```
   */
  copyLeftAligned(width: number): Rectangle {
    return this.copy({ width });
  }

  /**
   * ```plain
   * ┌──────┐    ┌╌╌╌┌──┐
   * │      │ -> ┆   │  │
   * │      │    ┆   │  │
   * └──────┘    └╌╌╌└──┘
   * ```
   */
  copyRightAligned(width: number): Rectangle {
    return this.copy({ left: this.right - width, width });
  }

  /**
   * ```plain
   * ┌────┐    ┌────┐
   * │    │    │    │
   * │    │ -> └────┘
   * │    │    ┆    ┆
   * └────┘    └╌╌╌╌┘
   * ```
   */
  copyTopAligned(height: number): Rectangle {
    return this.copy({ height });
  }

  /**
   * ```plain
   * ┌────┐    ┌╌╌╌╌┐
   * │    │    ┆    ┆
   * │    │ -> ┌────┐
   * │    │    │    │
   * └────┘    └────┘
   * ```
   */
  copyBottomAligned(height: number): Rectangle {
    return this.copy({ top: this.bottom - height, height });
  }

  svgText(
    text: string,
    props: {
      color?: string;
      fontSize?: number;
      horizontalAlign?: "left" | "center" | "right";
      verticalAlign?: "top" | "center" | "bottom";
      fontWeight?: string;
    },
  ): string {
    const {
      horizontalAlign = "left",
      verticalAlign = "bottom",
      fontSize = 16,
      fontWeight = "regular",
      color,
    } = props;

    let dominantBaseline: string;
    let y: number;
    switch (verticalAlign) {
      case "top": {
        y = this.top;
        dominantBaseline = "hanging";
        break;
      }
      case "center": {
        y = this.top + this.height / 2;
        dominantBaseline = "middle";
        break;
      }
      case "bottom": {
        y = this.bottom;
        dominantBaseline = "auto";
        break;
      }
    }

    let textAnchor: string;
    let x: number;
    switch (horizontalAlign) {
      case "left": {
        x = this.left;
        textAnchor = "start";
        break;
      }
      case "center": {
        x = this.left + this.width / 2;
        textAnchor = "middle";
        break;
      }
      case "right": {
        x = this.right;
        textAnchor = "end";
        break;
      }
    }

    return h(
      "text",
      {
        x,
        y,
        "dominant-baseline": dominantBaseline,
        "text-anchor": textAnchor,
        "font-size": fontSize,
        fill: color,
        "font-weight": fontWeight,
      },
      text,
    );
  }

  svgRect(
    color: string,
    options?: {
      rounded?: number;
    },
  ): string {
    return h("rect", {
      x: this.left,
      y: this.top,
      width: this.width,
      height: this.height,
      fill: color,
      rounded: options?.rounded,
      rx: options?.rounded,
      ry: options?.rounded,
    });
  }

  svgOutline(): string {
    return h("rect", {
      stroke: "red",
      "stroke-width": 1,
      "stroke-dasharray": 4,
      fill: "none",
      x: this.left,
      y: this.top,
      width: this.width,
      height: this.height,
    });
  }
}

function h(tag: string, props?: Record<string, any>, body?: string): string {
  return `<${tag}${
    props
      ? ` ${Object.entries(props)
          .map(([k, v]) => `${k}="${v}"`)
          .join(" ")}`
      : ""
  }>${body ?? ""}</${tag}>`;
}

const metals = ["🥇", "🥈", "🥉"];
