import React, { useState, useRef } from 'react';
import { ToolbarTop } from './components/ToolbarTop';
import { ToolbarBottom } from './components/ToolbarBottom';
import { MapCanvas } from './components/MapCanvas';
import { createDefault100x200Maze, applyDanger } from './lib/maze';
import { runBFS, runDijkstra } from './lib/pathfinder';
import { AlgorithmType, Point, RunStats, SearchStep, SpeedMode, Tool } from './types';

const INITIAL_START = { x: 10, y: 10 };
const INITIAL_END = { x: 90, y: 50 };

export default function App() {
  const [maze, setMaze] = useState(createDefault100x200Maze());
  
  const clearDangerFor = (m: number[][]) => Array.from({ length: m.length }, () => new Array(m[0]?.length || 0).fill(0));

  const [dangerZones, setDangerZones] = useState(() => clearDangerFor(maze));
  
  const [startPoint, setStartPoint] = useState<Point>(INITIAL_START);
  const [endPoint, setEndPoint] = useState<Point>(INITIAL_END);
  
  const [tool, setTool] = useState<Tool>('pan');
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('BFS');
  const [speed, setSpeed] = useState<SpeedMode>(2);
  
  const [explored, setExplored] = useState<Point[]>([]);
  const [path, setPath] = useState<Point[]>([]);
  
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<RunStats>({
    found: false,
    length: 0,
    cost: 0,
    exploredCount: 0,
    runtimeMs: 0
  });

  const [showLoadModal, setShowLoadModal] = useState(false);
  const [mapInput, setMapInput] = useState('');

  const runnerRef = useRef<number | null>(null);

  const clone2D = (arr: number[][]) => arr.map(row => [...row]);

  const handleCellClick = (x: number, y: number) => {
    if (isRunning) return;
    if (maze[y]?.[x] === 1) return;

    if (tool === 'start') {
      setStartPoint({ x, y });
    } else if (tool === 'end') {
      setEndPoint({ x, y });
    } else if (tool === 'danger') {
      setDangerZones(prev => {
        const newD = clone2D(prev);
        applyDanger(newD, maze, { x, y }, 2);
        return newD;
      });
    }
  };

  const handleCellDrag = (x: number, y: number) => {
    if (isRunning) return;
    if (tool === 'danger') {
      if (maze[y]?.[x] === 1) return;
      setDangerZones(prev => {
        const newD = clone2D(prev);
        applyDanger(newD, maze, { x, y }, 2);
        return newD;
      });
    }
  };

  const clearDanger = () => {
    if (isRunning) return;
    setDangerZones(clearDangerFor(maze));
  };

  const resetMapTo = (m: number[][]) => {
    stopAnimation();
    setExplored([]);
    setPath([]);
    setStartPoint(INITIAL_START);
    setEndPoint(INITIAL_END);
    setDangerZones(clearDangerFor(m));
    setStats({ found: false, length: 0, cost: 0, exploredCount: 0, runtimeMs: 0 });
  };

  const resetMap = () => resetMapTo(maze);

  const clearSearch = () => {
    stopAnimation();
    setExplored([]);
    setPath([]);
    setStats({ found: false, length: 0, cost: 0, exploredCount: 0, runtimeMs: 0 });
  };

  const stopAnimation = () => {
    if (runnerRef.current) {
        cancelAnimationFrame(runnerRef.current);
        runnerRef.current = null;
    }
    setIsRunning(false);
  };

  const runAnimation = () => {
    clearSearch();
    setIsRunning(true);

    const startTime = performance.now();
    let gen: Generator<SearchStep, void, unknown>;
    
    const w = maze[0]?.length || 0;
    const h = maze.length;

    if (algorithm === 'BFS') {
      gen = runBFS(maze, dangerZones, startPoint, endPoint, w, h);
    } else {
      gen = runDijkstra(maze, dangerZones, startPoint, endPoint, w, h);
    }

    const currentExplored: Point[] = [];
    let exploredCount = 0;

    const tick = () => {
      let stepsPerFrame = 1;
      if (speed === 2) stepsPerFrame = 20;
      if (speed === 3) stepsPerFrame = 150;

      let result: IteratorResult<SearchStep, void> | null = null;
      for (let i = 0; i < stepsPerFrame; i++) {
        result = gen.next();
        if (result.done) break;
        
        if (result.value.explored.length > 0) {
            currentExplored.push(...result.value.explored);
            exploredCount += result.value.explored.length;
        }
        
        if (result.value.found) break;
      }

      if (result && !result.done) {
        setExplored([...currentExplored]);
        setStats(prev => ({
            ...prev,
            exploredCount,
            runtimeMs: performance.now() - startTime
        }));

        if (result.value.found) {
            setPath(result.value.path || []);
            setStats(prev => ({
                ...prev,
                found: true,
                length: result.value.path?.length || 0,
                cost: result.value.cost || 0,
                runtimeMs: performance.now() - startTime
            }));
            setIsRunning(false);
            return;
        } else {
            runnerRef.current = requestAnimationFrame(tick);
        }
      } else {
         setIsRunning(false);
         setExplored([...currentExplored]);
      }
    };

    runnerRef.current = requestAnimationFrame(tick);
  };

  const handleLoadMap = () => {
    try {
      const firstBracket = mapInput.indexOf('[');
      const lastBracket = mapInput.lastIndexOf(']');
      if (firstBracket === -1 || lastBracket === -1) throw new Error('Could not find array brackets');
      
      const arrayText = mapInput.substring(firstBracket, lastBracket + 1);
      const parsed = JSON.parse(arrayText) as number[][];
      if (!Array.isArray(parsed) || !Array.isArray(parsed[0])) {
         throw new Error('Invalid format');
      }
      setMaze(parsed);
      resetMapTo(parsed);
      setShowLoadModal(false);
      setMapInput('');
    } catch(e) {
      alert("Failed to parse map. Please ensure it is a valid 2D array of 0s and 1s.");
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden text-slate-900 font-sans">
      <ToolbarTop 
        tool={tool} setTool={setTool}
        algorithm={algorithm} setAlgorithm={setAlgorithm}
        onClearDanger={clearDanger}
        onLoadMap={() => setShowLoadModal(true)}
      />
      
      <MapCanvas 
        maze={maze} dangerZones={dangerZones}
        startPoint={startPoint} endPoint={endPoint}
        explored={explored} path={path}
        onCellClick={handleCellClick}
        onCellDrag={handleCellDrag}
        isPanning={tool === 'pan'}
      />

      <ToolbarBottom 
        speed={speed} setSpeed={setSpeed}
        isRunning={isRunning}
        onRun={runAnimation}
        onStop={stopAnimation}
        onReset={resetMap}
        stats={stats}
      />

      {showLoadModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl flex flex-col max-h-[90vh]">
            <h2 className="text-xl font-bold mb-2">Load Python Array</h2>
            <p className="text-sm text-slate-500 mb-4">
              Paste your python array `maze = [[0, ...], ... ]` below.
            </p>
            <textarea
              className="flex-1 min-h-[300px] font-mono text-sm p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={mapInput}
              onChange={(e) => setMapInput(e.target.value)}
              placeholder="[\n  [0, 0, ...],\n  ...\n]"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowLoadModal(false)}
                className="px-4 py-2 font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLoadMap}
                className="px-4 py-2 font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Load Map
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
