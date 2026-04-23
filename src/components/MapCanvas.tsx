import React, { useEffect, useRef, useState, MouseEvent } from 'react';
import { Point } from '../types';
import { MapPin, Flag } from 'lucide-react';

interface Props {
  maze: number[][];
  dangerZones: number[][];
  startPoint: Point;
  endPoint: Point;
  explored: Point[];
  path: Point[];
  onCellClick: (x: number, y: number) => void;
  onCellDrag: (x: number, y: number) => void;
  isPanning: boolean;
}

export function MapCanvas({
  maze,
  dangerZones,
  startPoint,
  endPoint,
  explored,
  path,
  onCellClick,
  onCellDrag,
  isPanning,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const fgCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [cellSize, setCellSize] = useState(10);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [scrollStart, setScrollStart] = useState<Point | null>(null);

  const mazeHeight = maze.length;
  const mazeWidth = maze[0]?.length || 0;

  // calculate dynamic canvas size to fit screen
  useEffect(() => {
    if (!containerRef.current || mazeWidth === 0 || mazeHeight === 0) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Calculate cell size that perfectly fits width or height, with a tiny margin to prevent overflow loops
        const newSize = Math.max(2, Math.floor(Math.min(width / mazeWidth, height / mazeHeight) * 0.98));
        setCellSize(newSize);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [mazeWidth, mazeHeight]);

  // draw bg once
  useEffect(() => {
    const ctx = bgCanvasRef.current?.getContext('2d', { alpha: false });
    if (!ctx) return;
    
    ctx.fillStyle = '#f8fafc'; // Slate 50
    ctx.fillRect(0, 0, mazeWidth * cellSize, mazeHeight * cellSize);
    
    ctx.fillStyle = '#1e293b'; // Slate 800
    for (let y = 0; y < mazeHeight; y++) {
      for (let x = 0; x < mazeWidth; x++) {
        if (maze[y][x] === 1) {
             ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }
    
    ctx.strokeStyle = '#e2e8f0'; // Slate 200
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let x=0; x<=mazeWidth; x++) {
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, mazeHeight * cellSize);
    }
    for(let y=0; y<=mazeHeight; y++) {
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(mazeWidth * cellSize, y * cellSize);
    }
    ctx.stroke();
  }, [maze, mazeWidth, mazeHeight, cellSize]);

  // draw fg
  useEffect(() => {
    const ctx = fgCanvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, mazeWidth * cellSize, mazeHeight * cellSize);

    ctx.fillStyle = 'rgba(249, 115, 22, 0.5)'; // Orange 500 transparent
    for (let y = 0; y < mazeHeight; y++) {
      for (let x = 0; x < mazeWidth; x++) {
        if (dangerZones[y] && dangerZones[y][x] > 0) {
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }

    ctx.fillStyle = '#d8b4fe'; // Purple 300
    for(const p of explored) {
      if ((p.x === startPoint.x && p.y === startPoint.y) || (p.x === endPoint.x && p.y === endPoint.y)) continue;
      const sizeOffset = Math.max(1, Math.floor(cellSize * 0.1));
      ctx.fillRect(p.x * cellSize + sizeOffset, p.y * cellSize + sizeOffset, cellSize - (sizeOffset * 2), cellSize - (sizeOffset * 2));
    }

    if (path.length > 0) {
      ctx.strokeStyle = '#22c55e'; // Green 500
      ctx.lineWidth = Math.max(2, cellSize * 0.3);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(path[0].x * cellSize + cellSize/2, path[0].y * cellSize + cellSize/2);
      for(let i=1; i<path.length; i++) {
        ctx.lineTo(path[i].x * cellSize + cellSize/2, path[i].y * cellSize + cellSize/2);
      }
      ctx.stroke();
    }

  }, [dangerZones, startPoint, endPoint, explored, path, mazeWidth, mazeHeight, cellSize]);

  const getCellCoords = (e: MouseEvent<HTMLDivElement>) => {
    const rect = fgCanvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cellX = Math.floor(x / cellSize);
    const cellY = Math.floor(y / cellSize);

    if (cellX >= 0 && cellX < mazeWidth && cellY >= 0 && cellY < mazeHeight) {
      return { x: cellX, y: cellY };
    }
    return null;
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    setIsMouseDown(true);
    if (isPanning) {
      setDragStart({ x: e.clientX, y: e.clientY });
      if (containerRef.current) {
        setScrollStart({ x: containerRef.current.scrollLeft, y: containerRef.current.scrollTop });
      }
    } else {
      const coords = getCellCoords(e);
      if (coords) onCellClick(coords.x, coords.y);
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isMouseDown) return;

    if (isPanning && dragStart && scrollStart && containerRef.current) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      containerRef.current.scrollLeft = scrollStart.x - dx;
      containerRef.current.scrollTop = scrollStart.y - dy;
    } else if (!isPanning) {
      const coords = getCellCoords(e);
      if (coords) onCellDrag(coords.x, coords.y);
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setDragStart(null);
    setScrollStart(null);
  };

  const iconBaseSize = Math.max(20, cellSize * 2);

  return (
    <div 
      ref={containerRef}
      className={`relative flex-1 overflow-auto bg-slate-100 border-l border-slate-200 flex items-center justify-center ${isPanning ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        style={{ 
          width: mazeWidth * cellSize, 
          height: mazeHeight * cellSize, 
          position: 'relative',
          flexShrink: 0
        }}
      >
        <canvas 
          ref={bgCanvasRef} 
          width={mazeWidth * cellSize} 
          height={mazeHeight * cellSize} 
          className="absolute top-0 left-0 shadow-lg bg-white"
        />
        <canvas 
          ref={fgCanvasRef} 
          width={mazeWidth * cellSize} 
          height={mazeHeight * cellSize} 
          className="absolute top-0 left-0"
        />
        
        {/* Start Point Overlay */}
        <div 
          className="absolute flex items-center justify-center pointer-events-none z-10 transition-all duration-200"
          style={{
            left: startPoint.x * cellSize + cellSize / 2,
            top: startPoint.y * cellSize + cellSize / 2,
            width: iconBaseSize,
            height: iconBaseSize,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="bg-blue-600 rounded-full shadow-[0_4px_12px_rgba(37,99,235,0.5)] text-white flex items-center justify-center border-2 border-white/80 w-full h-full p-1.5 animate-pulse">
            <MapPin className="w-full h-full stroke-[2.5]" />
          </div>
        </div>

        {/* End Point Overlay */}
        <div 
          className="absolute flex items-center justify-center pointer-events-none z-10 transition-all duration-200"
          style={{
            left: endPoint.x * cellSize + cellSize / 2,
            top: endPoint.y * cellSize + cellSize / 2,
            width: iconBaseSize,
            height: iconBaseSize,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="bg-red-600 rounded-md shadow-[0_4px_12px_rgba(220,38,38,0.5)] text-white flex items-center justify-center border-2 border-white/80 w-full h-full p-1">
            <Flag className="w-full h-full stroke-[2.5]" />
          </div>
        </div>
      </div>
    </div>
  );
}
