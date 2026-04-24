export type Point = { x: number; y: number };

export type AlgorithmType = 'BFS' | 'Dijkstra';

export type SpeedMode = 1 | 2 | 3;

export type RunStats = {
  found: boolean;
  length: number;
  cost: number;
  exploredCount: number;
  runtimeMs: number;
};

export type SearchStep = {
  current: Point;
  explored: Point[];
  frontier: Point[];
  found: boolean;
  path?: Point[];
  cost?: number;
};

export type Tool = 'start' | 'end' | 'danger';
