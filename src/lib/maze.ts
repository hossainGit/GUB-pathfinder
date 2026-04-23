import { Point } from '../types';

export const CELL_SIZE = 40;

export const applyDanger = (
  dangerZones: number[][],
  maze: number[][],
  center: Point,
  radiusCells: number
) => {
  const height = maze.length;
  const width = maze[0]?.length || 0;
  
  for (let dy = -radiusCells; dy <= radiusCells; dy++) {
    for (let dx = -radiusCells; dx <= radiusCells; dx++) {
      if (dx * dx + dy * dy <= radiusCells * radiusCells) {
        const nx = center.x + dx;
        const ny = center.y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          if (maze[ny][nx] !== 1) { // not a wall
            dangerZones[ny][nx] = 1;
          }
        }
      }
    }
  }
};

export const createDefault100x200Maze = (): number[][] => {
  // A default 200 width x 100 height or 100x200 empty grid if needed,
  // but we mostly rely on loading the python array now.
  const maze = Array.from({ length: 100 }, () => new Array(200).fill(0));
  return maze;
};

