// ─── Algorithm step traces ───────────────────────────────────────────────────
// Sorting and searching implemented to emit a step-by-step trace the
// visualizer can animate: which indices are being compared/swapped and the
// array state after each operation. Pure and unit-tested.

export interface SortStep {
  array: number[];
  comparing?: [number, number];
  swapped?: [number, number];
  /** Indices that are in their final sorted position. */
  sorted: number[];
  note: string;
}

export interface SortTrace {
  name: string;
  steps: SortStep[];
  comparisons: number;
  swaps: number;
  complexity: { best: string; average: string; worst: string; space: string };
}

function snapshot(arr: number[]) {
  return [...arr];
}

export function bubbleSortTrace(input: number[]): SortTrace {
  const a = [...input];
  const steps: SortStep[] = [];
  const sorted: number[] = [];
  let comparisons = 0, swaps = 0;

  for (let end = a.length - 1; end > 0; end--) {
    let swappedInPass = false;
    for (let i = 0; i < end; i++) {
      comparisons++;
      steps.push({ array: snapshot(a), comparing: [i, i + 1], sorted: [...sorted], note: `Compare ${a[i]} and ${a[i + 1]}` });
      if (a[i] > a[i + 1]) {
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
        swaps++;
        swappedInPass = true;
        steps.push({ array: snapshot(a), swapped: [i, i + 1], sorted: [...sorted], note: `Swap → ${a[i]}, ${a[i + 1]}` });
      }
    }
    sorted.unshift(end);
    if (!swappedInPass) {
      for (let k = end - 1; k >= 0; k--) sorted.unshift(k);
      break;
    }
  }
  if (!sorted.includes(0)) sorted.unshift(0);
  steps.push({ array: snapshot(a), sorted: [...new Set(sorted)], note: "Sorted ✓" });
  return {
    name: "Bubble sort", steps, comparisons, swaps,
    complexity: { best: "O(n)", average: "O(n²)", worst: "O(n²)", space: "O(1)" },
  };
}

export function selectionSortTrace(input: number[]): SortTrace {
  const a = [...input];
  const steps: SortStep[] = [];
  const sorted: number[] = [];
  let comparisons = 0, swaps = 0;

  for (let i = 0; i < a.length - 1; i++) {
    let min = i;
    for (let j = i + 1; j < a.length; j++) {
      comparisons++;
      steps.push({ array: snapshot(a), comparing: [min, j], sorted: [...sorted], note: `Is ${a[j]} < ${a[min]}?` });
      if (a[j] < a[min]) min = j;
    }
    if (min !== i) {
      [a[i], a[min]] = [a[min], a[i]];
      swaps++;
      steps.push({ array: snapshot(a), swapped: [i, min], sorted: [...sorted], note: `Place minimum ${a[i]} at index ${i}` });
    }
    sorted.push(i);
  }
  sorted.push(a.length - 1);
  steps.push({ array: snapshot(a), sorted: [...sorted], note: "Sorted ✓" });
  return {
    name: "Selection sort", steps, comparisons, swaps,
    complexity: { best: "O(n²)", average: "O(n²)", worst: "O(n²)", space: "O(1)" },
  };
}

export function insertionSortTrace(input: number[]): SortTrace {
  const a = [...input];
  const steps: SortStep[] = [];
  let comparisons = 0, swaps = 0;

  for (let i = 1; i < a.length; i++) {
    let j = i;
    while (j > 0) {
      comparisons++;
      steps.push({ array: snapshot(a), comparing: [j - 1, j], sorted: [], note: `Insert ${a[j]}: compare with ${a[j - 1]}` });
      if (a[j - 1] > a[j]) {
        [a[j - 1], a[j]] = [a[j], a[j - 1]];
        swaps++;
        steps.push({ array: snapshot(a), swapped: [j - 1, j], sorted: [], note: `Shift left` });
        j--;
      } else break;
    }
  }
  steps.push({ array: snapshot(a), sorted: a.map((_, i) => i), note: "Sorted ✓" });
  return {
    name: "Insertion sort", steps, comparisons, swaps,
    complexity: { best: "O(n)", average: "O(n²)", worst: "O(n²)", space: "O(1)" },
  };
}

export const SORTERS = {
  bubble: bubbleSortTrace,
  selection: selectionSortTrace,
  insertion: insertionSortTrace,
} as const;

export type SorterKey = keyof typeof SORTERS;

// ─── Binary search trace ─────────────────────────────────────────────────────

export interface SearchStep {
  lo: number;
  hi: number;
  mid: number;
  note: string;
}

export function binarySearchTrace(sortedArr: number[], target: number): { steps: SearchStep[]; foundIndex: number | null } {
  const steps: SearchStep[] = [];
  let lo = 0, hi = sortedArr.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (sortedArr[mid] === target) {
      steps.push({ lo, hi, mid, note: `a[${mid}] = ${sortedArr[mid]} — found!` });
      return { steps, foundIndex: mid };
    }
    if (sortedArr[mid] < target) {
      steps.push({ lo, hi, mid, note: `a[${mid}] = ${sortedArr[mid]} < ${target} → search right half` });
      lo = mid + 1;
    } else {
      steps.push({ lo, hi, mid, note: `a[${mid}] = ${sortedArr[mid]} > ${target} → search left half` });
      hi = mid - 1;
    }
  }
  return { steps, foundIndex: null };
}

/** Random array for the visualizer. */
export function randomArray(n = 12, max = 99): number[] {
  return Array.from({ length: n }, () => 1 + Math.floor(Math.random() * max));
}
