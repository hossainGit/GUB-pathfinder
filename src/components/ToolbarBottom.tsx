import React from 'react';
import { Play, Square, RotateCcw } from 'lucide-react';
import { SpeedMode, RunStats } from '../types';
import { cn } from '../lib/utils';

interface Props {
  speed: SpeedMode;
  setSpeed: (s: SpeedMode) => void;
  isRunning: boolean;
  onRun: () => void;
  onStop: () => void;
  onReset: () => void;
  stats: RunStats;
}

export function ToolbarBottom({
  speed,
  setSpeed,
  isRunning,
  onRun,
  onStop,
  onReset,
  stats
}: Props) {
  
  return (
    <div className="bg-white shadow-[0_-2px_10px_-3px_rgb(0,0,0,0.1)] border-t border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4 z-10">
      
      {/* Speed Control */}
      <div className="flex-1 w-full md:w-auto max-w-xs flex items-center gap-4 px-4 border-r border-transparent md:border-slate-100">
        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
          Speed
        </label>
        <input 
          type="range" min="1" max="3" step="1" 
          value={speed} onChange={(e) => setSpeed(parseInt(e.target.value) as SpeedMode)}
          className="w-full accent-blue-600"
        />
        <span className="text-xs font-semibold text-slate-400 w-12 text-center">
            {speed === 1 ? 'Slow' : speed === 2 ? 'Med' : 'Fast'}
        </span>
      </div>

      {/* Core Controls */}
      <div className="flex items-center justify-center gap-3 w-full md:w-auto">
          {!isRunning ? (
            <button 
              onClick={onRun}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors flex-1 md:flex-auto"
            >
              <Play className="w-4 h-4 fill-current" />
              Find Path
            </button>
          ) : (
            <button 
              onClick={onStop}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-sm transition-colors flex-1 md:flex-auto"
            >
              <Square className="w-4 h-4 fill-current" />
              Stop
            </button>
          )}
          <button 
            onClick={onReset}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors border border-slate-200"
            title="Reset Map"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
      </div>

      {/* Stats */}
      <div className="flex-1 w-full md:w-auto flex flex-wrap md:flex-nowrap items-center justify-end gap-x-6 gap-y-2 text-sm text-slate-600 font-mono px-4 border-l border-transparent md:border-slate-100">
        <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status</span>
            <span className={cn("font-bold text-base", 
              stats.found ? 'text-green-600' : isRunning ? 'text-blue-600' : stats.exploredCount > 0 && !stats.found && !isRunning ? 'text-red-600' : 'text-slate-900'
            )}>
              {stats.found ? 'Found' : isRunning ? 'Searching' : stats.exploredCount > 0 ? 'No Path' : 'Idle'}
            </span>
        </div>
        <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Length</span>
            <span className="font-bold text-slate-900">{stats.length > 0 ? stats.length : '-'}</span>
        </div>
        <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cost</span>
            <span className="font-bold text-slate-900">{stats.cost > 0 ? stats.cost : '-'}</span>
        </div>
        <div className="flex flex-col items-center hidden md:flex">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Explored</span>
            <span className="font-bold text-slate-900">{stats.exploredCount}</span>
        </div>
        <div className="flex flex-col items-center hidden lg:flex">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Runtime</span>
            <span className="font-bold text-slate-900">{stats.runtimeMs > 0 ? `${stats.runtimeMs.toFixed(0)} ms` : '-'}</span>
        </div>
      </div>

    </div>
  );
}
