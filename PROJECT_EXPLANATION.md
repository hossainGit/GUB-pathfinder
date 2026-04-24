# Campus Navigator: Pathfinding Simulation

This document provides an in-depth technical explanation of the Campus Navigator project, its architecture, file structure, visual rendering strategy, and the mechanics behind the pathfinding algorithms and their visualization.

## Architecture Overview

At its core, Campus Navigator is a React-based single-page application (SPA) implemented in TypeScript. The application visualizes graph traversal and shortest-path calculation algorithms on a 2D grid. To achieve high-performance rendering without blocking the browser's main thread during computationally heavy pathfinding, the system relies on a combination of **TypeScript Generator Functions** for algorithmic yielding and **HTML5 Canvas** for efficient high-fps drawing.

## Folder Structure

The application's source code is modularized within the `/src` directory to decouple UI components, state management, and algorithmic logic.

```
/src
├── components/
│   ├── MapCanvas.tsx        # High-performance Canvas rendering layer
│   ├── ToolbarTop.tsx       # Top UI for tool selection (start/end/danger)
│   └── ToolbarBottom.tsx    # Bottom UI for playback controls & statistics
├── lib/
│   ├── defaultMaze.ts       # A pre-compiled 2D array representation of the map
│   ├── maze.ts              # Data operations for grid manipulation (e.g., generating danger zones)
│   └── pathfinder.ts        # The core pathfinding algorithms (BFS, Dijkstra) using Generators
├── types.ts                 # Global TypeScript interfaces and types
├── App.tsx                  # Application entry point, state orchestrator, and animation loop runner
└── main.tsx                 # React DOM mount point
```

### Visuals vs. Algorithms

*   **Algorithms (The "Brain"):** The graph traversal logic is strictly contained within `/src/lib/pathfinder.ts`. This file does not know about React or the DOM. It only computes mathematical positions and yields steps.
*   **Visuals (The "View"):** The visual rendering is isolated in `/src/components/MapCanvas.tsx`. It blindly receives arrays of points (explored nodes, path nodes) and paints them to the screen using the `CanvasRenderingContext2D` API to guarantee performance scaling on larger matrices.
*   **Orchestration (The "Controller"):** `/src/App.tsx` acts as the bridge. It manages the user's interaction state (where the endpoints are, where danger zones are drawn), invokes the algorithms from `pathfinder.ts`, and feeds the resulting coordinate updates down into `MapCanvas.tsx` via `requestAnimationFrame`.

---

## Detailed Algorithm Mechanics

The main objective of the algorithms is to find a path from a `start` point to an `end` point on a 2D grid while avoiding obstacles (walls) and dealing with weighted terrain (danger zones).

### The Graph Representation
The map is a 2D matrix (`maze: number[][]`).
* `0` represents open pathing space (base cost).
* `1` represents a wall/building (unpathable).
* Additional `dangerZones` are stored in a parallel matrix, representing an added traversal cost (simulating areas to avoid unless necessary).

We treat the grid as an unweighted or weighted undirected graph where nodes are `(x, y)` cells and edges connect horizontally and vertically to the 4 adjacent neighbors (Up, Down, Left, Right).

### Generator Functions for Animation

If we ran a standard `while(queue.length > 0)` loop, the pathfinder would complete in less than a millisecond, and the user would only see the final result instantly.

To visualize the *process* of searching, the algorithms in `pathfinder.ts` are written as **Generators** (`function*`).

1. The algorithm processes one node (or a batch of nodes).
2. It yields the current state: `yield { explored: newExploredList, path: null, found: false }`.
3. Execution pauses.
4. `App.tsx` receives this yielded object, updates the React state (which paints the new purple "explored" squares), and schedules the next `.next()` call to run on the next browser frame using `requestAnimationFrame`.

This pattern maintains a responsive 60 FPS UI while processing the traversal step-by-step.

### 1. Breadth-First Search (BFS)
BFS is used as the standard, unweighted pathfinding algorithm. It is guaranteed to find the shortest path in terms of *number of steps* in an unweighted grid, but it ignores the "danger zones".

*   **Data Structure:** A queue (FIFO).
*   **Tracking:** A `visited` boolean matrix to prevent processing the same cell twice. A parallel `parent` matrix (or a map) to remember *how* we reached each cell.
*   **Exploration:** It dequeues a point, checks its 4 neighbors. If a neighbor is walkable and unseen, we mark its parent as the current point, enqueue it, and mark it visited.
*   **Yielding:** Periodically yields the newly explored cells to trigger the purple animation on the canvas.

### 2. Dijkstra's Algorithm (Emergency/Weighted Search)
Dijkstra's is used when "danger zones" are added to the map. Not all cells cost the same to traverse. A normal cell might cost `1`, while walking through a danger zone might cost `10`. Dijkstra guarantees the *least expensive* path.

*   **Data Structure:** A Priority Queue (Min-Heap), ordered by the cumulative cost to reach a cell from the start. (Often implemented with a simple sorted array in JS if the dataset is small enough, though a true Min-Heap is optimal).
*   **Tracking:** A `costs` matrix tracking the lowest known cost to reach `(x, y)`. Initialized to infinity. A `parent` matrix to remember the path.
*   **Exploration:** The algorithm pops the cell with the lowest cumulative cost. It checks neighbors, adding the travel cost to the neighbor (base travel + danger zone penalty). If this new calculated cost is *lower* than the previously known cost to reach that neighbor, we update the cost, update the parent pointer, and push it to the priority queue.
*   **Yielding:** Similar to BFS, it yields nodes as they are fully relaxed (processed) to visualize the expansion of the shortest-path frontier.

### Tracing the Shortest Path

Both algorithms share the exact same logic for path reconstruction.
Once the algorithm dequeues the `end` node, the search stops.
Because we maintained a `parent` reference for every visited node, we can trace backwards:

```javascript
let current = endNode;
const path = [];
while (current !== null) {
    path.push(current);
    current = parentMap[current.x][current.y];
}
path.reverse(); // Now goes from Start -> End
```

This traced path is then returned via the final generator yield (`yield { explored: [], path: finalPath, found: true }`) and drawn as a bold green line segment on the canvas.
