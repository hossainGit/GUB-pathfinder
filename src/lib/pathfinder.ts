import { Point, SearchStep } from '../types';

export class MinHeap<T> {
  private data: { value: T; priority: number }[] = [];

  push(value: T, priority: number) {
    this.data.push({ value, priority });
    this.bubbleUp(this.data.length - 1);
  }

  pop(): T | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const bottom = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = bottom;
      this.sinkDown(0);
    }
    return top.value;
  }

  isEmpty() {
    return this.data.length === 0;
  }

  private bubbleUp(idx: number) {
    const element = this.data[idx];
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      const parent = this.data[parentIdx];
      if (element.priority >= parent.priority) break;
      this.data[parentIdx] = element;
      this.data[idx] = parent;
      idx = parentIdx;
    }
  }

  private sinkDown(idx: number) {
    const length = this.data.length;
    const element = this.data[idx];
    while (true) {
      const leftChildIdx = 2 * idx + 1;
      const rightChildIdx = 2 * idx + 2;
      let leftChild, rightChild;
      let swap = null;

      if (leftChildIdx < length) {
        leftChild = this.data[leftChildIdx];
        if (leftChild.priority < element.priority) {
          swap = leftChildIdx;
        }
      }

      if (rightChildIdx < length) {
        rightChild = this.data[rightChildIdx];
        if (
          (swap === null && rightChild.priority < element.priority) ||
          (swap !== null && rightChild.priority < leftChild!.priority) 
        ) {
          swap = rightChildIdx;
        }
      }

      if (swap === null) break;
      this.data[idx] = this.data[swap];
      this.data[swap] = element;
      idx = swap;
    }
  }
}

// Helpers
const getNeighbors = (p: Point, width: number, height: number): Point[] => {
  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  const neighbors: Point[] = [];
  for (const [dx, dy] of dirs) {
    const nx = p.x + dx;
    const ny = p.y + dy;
    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
      neighbors.push({ x: nx, y: ny });
    }
  }
  return neighbors;
};

const pointToId = (p: Point) => `${p.x},${p.y}`;

export function* runBFS(
  maze: number[][],
  dangerZones: number[][],
  start: Point,
  end: Point,
  width: number,
  height: number
): Generator<SearchStep, void, unknown> {
  const queue: Point[] = [start];
  const visited = new Set<string>();
  const parent = new Map<string, Point | null>();
  visited.add(pointToId(start));
  parent.set(pointToId(start), null);

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.x === end.x && current.y === end.y) {
      const path: Point[] = [];
      let curr: Point | null = current;
      while (curr !== null) {
        path.push(curr);
        curr = parent.get(pointToId(curr)) || null;
      }
      path.reverse();
      yield { current, explored: [], frontier: [], found: true, path, cost: path.length - 1 };
      return;
    }

    const newlyExplored: Point[] = [current];

    for (const neighbor of getNeighbors(current, width, height)) {
      if (maze[neighbor.y][neighbor.x] === 1) continue; // wall
      const id = pointToId(neighbor);
      if (!visited.has(id)) {
        visited.add(id);
        parent.set(id, current);
        queue.push(neighbor);
      }
    }

    yield { current, explored: newlyExplored, frontier: [...queue], found: false };
  }

  yield { current: start, explored: [], frontier: [], found: false, cost: 0, path: [] };
}

export function* runDijkstra(
  maze: number[][],
  dangerZones: number[][],
  start: Point,
  end: Point,
  width: number,
  height: number
): Generator<SearchStep, void, unknown> {
  const pq = new MinHeap<Point>();
  pq.push(start, 0);
  
  const costSoFar = new Map<string, number>();
  const parent = new Map<string, Point | null>();
  costSoFar.set(pointToId(start), 0);
  parent.set(pointToId(start), null);

  const visited = new Set<string>();

  while (!pq.isEmpty()) {
    const current = pq.pop()!;
    
    if (visited.has(pointToId(current))) continue; 
    visited.add(pointToId(current));

    if (current.x === end.x && current.y === end.y) {
      const path: Point[] = [];
      let curr: Point | null = current;
      while (curr !== null) {
        path.push(curr);
        curr = parent.get(pointToId(curr)) || null;
      }
      path.reverse();
      yield { current, explored: [], frontier: [], found: true, path, cost: costSoFar.get(pointToId(current)) };
      return;
    }

    for (const neighbor of getNeighbors(current, width, height)) {
      if (maze[neighbor.y][neighbor.x] === 1) continue; // wall
      
      const stepCost = dangerZones[neighbor.y][neighbor.x] > 0 ? 8 : 1;
      const newCost = costSoFar.get(pointToId(current))! + stepCost;
      const neighborId = pointToId(neighbor);

      if (!costSoFar.has(neighborId) || newCost < costSoFar.get(neighborId)!) {
        costSoFar.set(neighborId, newCost);
        parent.set(neighborId, current);
        pq.push(neighbor, newCost);
      }
    }

    yield { current, explored: [current], frontier: [], found: false };
  }

  yield { current: start, explored: [], frontier: [], found: false, cost: 0, path: [] };
}
