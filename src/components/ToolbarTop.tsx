import React from 'react';
import { MapPin, Flag, AlertTriangle, Eraser } from 'lucide-react';
import { Tool, AlgorithmType } from '../types';
import { cn } from '../lib/utils';

interface Props {
  tool: Tool;
  setTool: (t: Tool) => void;
  algorithm: AlgorithmType;
  setAlgorithm: (a: AlgorithmType) => void;
  onClearDanger: () => void;
}

export function ToolbarTop({
  tool,
  setTool,
  algorithm,
  setAlgorithm,
  onClearDanger,
}: Props) {
  
  const ToolButton = ({ t, icon: Icon, label }: { t: Tool, icon: any, label: string }) => (
    <button
      onClick={() => setTool(t)}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-colors",
        tool === t ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="bg-white shadow-sm border-b border-slate-200 p-3 flex flex-wrap items-center justify-between gap-4 z-10">
      
      {/* Brand */}
      <div className="flex items-center gap-4 border-r border-slate-100 pr-4">
        <div>
            <h1 className="text-lg font-bold font-sans text-slate-900 leading-tight">Campus Nav</h1>
        </div>
      </div>

      {/* Map Tools */}
      <div className="flex flex-wrap items-center justify-center gap-2 flex-1">
        <ToolButton t="start" icon={MapPin} label="Start" />
        <ToolButton t="end" icon={Flag} label="End" />
        <ToolButton t="danger" icon={AlertTriangle} label="Add danger" />
        <button 
          onClick={onClearDanger}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-md transition-colors border border-orange-200 ml-1"
          title="Clear Danger Zones"
        >
          <Eraser className="w-4 h-4" />
          <span className="hidden sm:inline">Clear Danger</span>
        </button>
      </div>

      {/* Algorithm Settings */}
      <div className="flex items-center bg-slate-100 p-1 rounded-lg border-l border-slate-200 ml-auto">
        {(['BFS', 'Dijkstra'] as AlgorithmType[]).map(alg => (
          <button
            key={alg}
            onClick={() => setAlgorithm(alg)}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap",
              algorithm === alg ? "bg-white shadow text-blue-700" : "text-slate-600 hover:text-slate-900"
            )}
          >
            {alg}
          </button>
        ))}
      </div>
      
    </div>
  );
}
