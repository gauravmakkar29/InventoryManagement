import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

interface UseVirtualTableOptions {
  count: number;
  estimateSize?: number;
  overscan?: number;
}

/**
 * Reusable hook for virtualized table rows.
 * Renders only visible rows — handles 10,000+ rows at 60fps.
 *
 * Usage:
 * ```tsx
 * const { parentRef, virtualRows, totalSize } = useVirtualTable({
 *   count: filteredData.length,
 *   estimateSize: 52,
 * });
 *
 * <div ref={parentRef} className="overflow-auto h-[500px]">
 *   <table>
 *     <tbody style={{ height: totalSize, position: 'relative' }}>
 *       {virtualRows.map(row => (
 *         <tr key={row.key} style={{
 *           position: 'absolute',
 *           top: row.start,
 *           height: row.size,
 *         }}>
 *           {renderRow(data[row.index])}
 *         </tr>
 *       ))}
 *     </tbody>
 *   </table>
 * </div>
 * ```
 */
export function useVirtualTable({
  count,
  estimateSize = 52,
  overscan = 5,
}: UseVirtualTableOptions) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  return {
    parentRef,
    virtualRows: virtualizer.getVirtualItems(),
    totalSize: virtualizer.getTotalSize(),
    virtualizer,
  };
}
