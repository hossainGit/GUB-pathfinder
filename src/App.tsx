import React, { useState, useRef } from 'react';
import { ToolbarTop } from './components/ToolbarTop';
import { ToolbarBottom } from './components/ToolbarBottom';
import { MapCanvas } from './components/MapCanvas';
import { applyDanger } from './lib/maze';
import { defaultMaze } from './lib/defaultMaze';
import { runBFS, runDijkstra } from './lib/pathfinder';
import { AlgorithmType, Point, RunStats, SearchStep, SpeedMode, Tool } from './types';

const INITIAL_START = { x: 10, y: 10 };
const INITIAL_END = { x: 90, y: 50 };

export default function App() {
  const [maze, setMaze] = useState<number[][]>(defaultMaze);
  
  const clearDangerFor = (m: number[][]) => Array.from({ length: m.length }, () => new Array(m[0]?.length || 0).fill(0));

  const [dangerZones, setDangerZones] = useState(() => clearDangerFor(maze));
  
  const [startPoint, setStartPoint] = useState<Point>(INITIAL_START);
  const [endPoint, setEndPoint] = useState<Point>(INITIAL_END);
  
  const [tool, setTool] = useState<Tool>('start');
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('BFS');
  const [speed, setSpeed] = useState<SpeedMode>(3);
  
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
        
        const step = result.value as SearchStep;
        if (step.explored.length > 0) {
            currentExplored.push(...step.explored);
            exploredCount += step.explored.length;
        }
        
        if (step.found) break;
      }

      if (result && !result.done) {
        const finalStep = result.value as SearchStep;
        setExplored([...currentExplored]);
        setStats(prev => ({
            ...prev,
            exploredCount,
            runtimeMs: performance.now() - startTime
        }));

        if (finalStep.found) {
            setPath(finalStep.path || []);
            setStats(prev => ({
                ...prev,
                found: true,
                length: finalStep.path?.length || 0,
                cost: finalStep.cost || 0,
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

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden text-slate-900 font-sans">
      <ToolbarTop 
        tool={tool} setTool={setTool}
        algorithm={algorithm} setAlgorithm={setAlgorithm}
        onClearDanger={clearDanger}
      />
      
      <MapCanvas 
        maze={maze} dangerZones={dangerZones}
        startPoint={startPoint} endPoint={endPoint}
        explored={explored} path={path}
        onCellClick={handleCellClick}
        onCellDrag={handleCellDrag}
        isPanning={false}
      />

      <ToolbarBottom 
        speed={speed} setSpeed={setSpeed}
        isRunning={isRunning}
        onRun={runAnimation}
        onStop={stopAnimation}
        onReset={resetMap}
        stats={stats}
      />
    </div>
  );
}
