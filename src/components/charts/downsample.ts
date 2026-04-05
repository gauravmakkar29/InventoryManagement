/**
 * IMS Gen 2 — LTTB Point Decimation (Story #373)
 *
 * Largest-Triangle-Three-Buckets downsampling for time-series charts.
 * Preserves visual fidelity (peaks, valleys, trends) while reducing
 * point count to match pixel density.
 *
 * @see Steinarsson, S. (2013) "Downsampling Time Series for Visual Representation"
 */

/**
 * Downsample an array using the LTTB algorithm.
 *
 * @param data      - Source array (any type)
 * @param threshold - Target number of output points
 * @param getX      - Extract x-axis value (typically time index)
 * @param getY      - Extract y-axis value (the metric)
 * @returns Downsampled array preserving first and last points
 */
export function lttbDownsample<T>(
  data: T[],
  threshold: number,
  getX: (d: T, i: number) => number,
  getY: (d: T) => number,
): T[] {
  if (threshold >= data.length || threshold < 3) return data;

  const sampled: T[] = [];
  const bucketSize = (data.length - 2) / (threshold - 2);

  // Always keep first point
  sampled.push(data[0]!);
  let prevIndex = 0;

  for (let i = 1; i < threshold - 1; i++) {
    // Current bucket boundaries
    const bucketStart = Math.floor((i - 1) * bucketSize) + 1;
    const bucketEnd = Math.min(Math.floor(i * bucketSize) + 1, data.length);

    // Next bucket boundaries (for average point)
    const nextBucketStart = Math.min(Math.floor(i * bucketSize) + 1, data.length);
    const nextBucketEnd = Math.min(Math.floor((i + 1) * bucketSize) + 1, data.length);

    // Average of next bucket
    let avgX = 0;
    let avgY = 0;
    let nextCount = 0;
    for (let j = nextBucketStart; j < nextBucketEnd; j++) {
      avgX += getX(data[j]!, j);
      avgY += getY(data[j]!);
      nextCount++;
    }
    if (nextCount > 0) {
      avgX /= nextCount;
      avgY /= nextCount;
    }

    // Find point in current bucket with largest triangle area
    const prevX = getX(data[prevIndex]!, prevIndex);
    const prevY = getY(data[prevIndex]!);
    let maxArea = -1;
    let maxIdx = bucketStart;

    for (let j = bucketStart; j < bucketEnd; j++) {
      const area = Math.abs(
        (prevX - avgX) * (getY(data[j]!) - prevY) - (prevX - getX(data[j]!, j)) * (avgY - prevY),
      );
      if (area > maxArea) {
        maxArea = area;
        maxIdx = j;
      }
    }

    sampled.push(data[maxIdx]!);
    prevIndex = maxIdx;
  }

  // Always keep last point
  sampled.push(data[data.length - 1]!);
  return sampled;
}
