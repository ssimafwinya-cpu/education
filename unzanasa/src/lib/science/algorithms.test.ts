import { describe, it, expect } from "vitest";
import {
  bubbleSortTrace, selectionSortTrace, insertionSortTrace, binarySearchTrace, SORTERS,
} from "./algorithms";

const isSorted = (a: number[]) => a.every((v, i) => i === 0 || a[i - 1] <= v);

describe("sort traces", () => {
  const cases = [
    [5, 2, 9, 1, 7],
    [3, 3, 1, 2],
    [1, 2, 3, 4],   // already sorted
    [9, 7, 5, 3],   // reverse
    [42],           // single element
  ];

  for (const [name, fn] of Object.entries(SORTERS)) {
    describe(name, () => {
      it("final step is the sorted array for every case", () => {
        for (const input of cases) {
          const trace = fn(input);
          const final = trace.steps[trace.steps.length - 1].array;
          expect(isSorted(final)).toBe(true);
          expect([...final].sort((a, b) => a - b)).toEqual([...input].sort((a, b) => a - b));
        }
      });
      it("does not mutate the input", () => {
        const input = [5, 2, 9];
        const copy = [...input];
        fn(input);
        expect(input).toEqual(copy);
      });
      it("counts comparisons and swaps", () => {
        const trace = fn([3, 2, 1]);
        expect(trace.comparisons).toBeGreaterThan(0);
        expect(trace.swaps).toBeGreaterThan(0);
        expect(trace.complexity.worst).toContain("O(");
      });
      it("every step carries a full array snapshot", () => {
        const trace = fn([4, 1, 3]);
        for (const step of trace.steps) {
          expect(step.array).toHaveLength(3);
          expect(typeof step.note).toBe("string");
        }
      });
    });
  }

  it("bubble sort best case (already sorted) exits early", () => {
    const trace = bubbleSortTrace([1, 2, 3, 4, 5]);
    expect(trace.swaps).toBe(0);
    expect(trace.comparisons).toBe(4); // one pass
  });

  it("insertion sort on sorted input does n-1 comparisons", () => {
    const trace = insertionSortTrace([1, 2, 3, 4]);
    expect(trace.comparisons).toBe(3);
    expect(trace.swaps).toBe(0);
  });

  it("selection sort swap count is at most n-1", () => {
    const trace = selectionSortTrace([9, 1, 8, 2, 7]);
    expect(trace.swaps).toBeLessThanOrEqual(4);
  });
});

describe("binarySearchTrace", () => {
  const arr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];

  it("finds an existing element with a logarithmic number of steps", () => {
    const { steps, foundIndex } = binarySearchTrace(arr, 23);
    expect(foundIndex).toBe(5);
    expect(steps.length).toBeLessThanOrEqual(Math.ceil(Math.log2(arr.length)) + 1);
    expect(steps[steps.length - 1].note).toContain("found");
  });

  it("returns null for a missing element", () => {
    const { foundIndex, steps } = binarySearchTrace(arr, 40);
    expect(foundIndex).toBeNull();
    expect(steps.length).toBeGreaterThan(0);
  });

  it("finds first and last elements", () => {
    expect(binarySearchTrace(arr, 2).foundIndex).toBe(0);
    expect(binarySearchTrace(arr, 91).foundIndex).toBe(9);
  });

  it("handles an empty array", () => {
    const { foundIndex, steps } = binarySearchTrace([], 5);
    expect(foundIndex).toBeNull();
    expect(steps).toHaveLength(0);
  });
});
