import React from 'react';
import { Brain, ShieldCheck, MessageSquare } from 'lucide-react';
import { JournalEntry } from '../types';

interface StatsBarProps {
  entries: JournalEntry[];
  userEmail: string | null;
}

export const StatsBar: React.FC<StatsBarProps> = ({ entries }) => {
  const totalMessages = entries.reduce((acc, curr) => acc + (curr.messages?.length || 0), 0);
  const reflectionCount = entries.filter((e) => e.mode === 'reflection').length;
  const brainstormCount = entries.filter((e) => e.mode === 'brainstorm').length;
  const actionPlanCount = entries.filter((e) => e.mode === 'action_plan').length;

  return (
    <div className="bg-zinc-900/60 border-b border-zinc-800/80 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400 backdrop-blur-sm">
      <div className="flex items-center space-x-4 overflow-x-auto">
        <div className="flex items-center space-x-1.5 font-medium text-zinc-300">
          <Brain className="w-3.5 h-3.5 text-amber-400" />
          <span>{entries.length} Reflections</span>
        </div>

        <div className="flex items-center space-x-1.5 font-medium text-zinc-300">
          <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
          <span>{totalMessages} Dialogue Turns</span>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-zinc-400">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-zinc-300">
            {reflectionCount} Reflect
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-zinc-300">
            {brainstormCount} Brainstorm
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-zinc-300">
            {actionPlanCount} Actions
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2 text-emerald-400 text-[11px] font-mono bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-0.5 rounded-full">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Owner-Bound: /users/{'{uid}'}/entries</span>
      </div>
    </div>
  );
};
