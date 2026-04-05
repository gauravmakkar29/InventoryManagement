import { describe, it, expect } from "vitest";
import { lttbDownsample } from "../../components/charts/downsample";

interface Point {
  x: number;
  y: number;
}

const getX = (_d: Point, i: number) => i;
const getY = (d: Point) => d.y;

describe("lttbDownsample", () => {
  it("returns original array when below threshold", () => {
    const data: Point[] = [
      { x: 0, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 3 },
    ];
    const result = lttbDownsample(data, 5, getX, getY);
    expect(result).toBe(data); // same reference
  });

  it("returns original array when threshold < 3", () => {
    const data: Point[] = Array.from({ length: 100 }, (_, i) => ({ x: i, y: Math.sin(i) }));
    expect(lttbDownsample(data, 2, getX, getY)).toBe(data);
    expect(lttbDownsample(data, 0, getX, getY)).toBe(data);
  });

  it("reduces point count to threshold", () => {
    const data: Point[] = Array.from({ length: 1000 }, (_, i) => ({
      x: i,
      y: Math.sin(i / 50) * 100,
    }));
    const result = lttbDownsample(data, 100, getX, getY);
    expect(result).toHaveLength(100);
  });

  it("preserves first and last points", () => {
    const data: Point[] = Array.from({ length: 500 }, (_, i) => ({
      x: i,
      y: i * 2,
    }));
    const result = lttbDownsample(data, 50, getX, getY);
    expect(result[0]).toBe(data[0]);
    expect(result[result.length - 1]).toBe(data[data.length - 1]);
  });

  it("preserves prominent peaks", () => {
    // Flat data with a single spike at index 500
    const data: Point[] = Array.from({ length: 1000 }, (_, i) => ({
      x: i,
      y: i === 500 ? 1000 : 10,
    }));
    const result = lttbDownsample(data, 50, getX, getY);
    // The spike should be preserved in the output
    const maxY = Math.max(...result.map((d) => d.y));
    expect(maxY).toBe(1000);
  });

  it("handles constant values without error", () => {
    const data: Point[] = Array.from({ length: 200 }, (_, i) => ({
      x: i,
      y: 42,
    }));
    const result = lttbDownsample(data, 20, getX, getY);
    expect(result).toHaveLength(20);
    expect(result.every((d) => d.y === 42)).toBe(true);
  });

  it("works with typed telemetry-like data", () => {
    interface TelemetryPoint {
      timestamp: string;
      temperature: number;
      cpuLoad: number;
    }

    const data: TelemetryPoint[] = Array.from({ length: 10000 }, (_, i) => ({
      timestamp: new Date(Date.now() - (10000 - i) * 60000).toISOString(),
      temperature: 45 + Math.sin(i / 100) * 15,
      cpuLoad: 35 + Math.cos(i / 80) * 25,
    }));

    const result = lttbDownsample(
      data,
      400,
      (_d, i) => i,
      (d) => d.temperature,
    );

    expect(result).toHaveLength(400);
    expect(result[0]).toBe(data[0]);
    expect(result[result.length - 1]).toBe(data[data.length - 1]);
  });
});
