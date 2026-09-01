import React, { useState } from 'react';
import {
  Search,
  Plus,
  Pin,
  Brain,
  Lightbulb,
  ListChecks,
  FileText,
  Trash2,
} from 'lucide-react';
import { JournalEntry, ReflectionMode } from '../types';

interface EntryListProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (entryId: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

const MODE_ICONS: Record<ReflectionMode, React.FC<{ className?: string }>> = {
  reflection: Brain,
  brainstorm: Lightbulb,
  action_plan: ListChecks,
  summary: FileText,
};

export const EntryList: React.FC<EntryListProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModeFilter, setSelectedModeFilter] = useState<string>('all');

  const filteredEntries = entries.filter((entry) => {
    // Mode filter
    if (selectedModeFilter !== 'all' && entry.mode !== selectedModeFilter) {
      return false;
    }

    // Search query filter
    if (!searchQuery.trim()) return true;
    const queryLower = searchQuery.toLowerCase();
    const matchTitle = (entry.title || '').toLowerCase().includes(queryLower);
    const matchTags = (entry.tags || []).some((t) => t.toLowerCase().includes(queryLower));
    const matchMessages = (entry.messages || []).some((m) =>
      m.content.toLowerCase().includes(queryLower)
    );
    const matchSummary = (entry.summary || '').toLowerCase().includes(queryLower);

    return matchTitle || matchTags || matchMessages || matchSummary;
  });

  const pinnedEntries = filteredEntries.filter((e) => e.pinned);
  const unpinnedEntries = filteredEntries.filter((e) => !e.pinned);

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const renderEntryCard = (entry: JournalEntry) => {
    const isSelected = entry.id === selectedEntryId;
    const ModeIcon = MODE_ICONS[entry.mode] || Brain;
    const previewText =
      entry.summary ||
      (entry.messages.length > 0
        ? entry.messages[entry.messages.length - 1].content
        : 'Empty reflection draft...');

    return (
      <div
        key={entry.id}
        id={`entry-card-${entry.id}`}
        onClick={() => {
          onSelectEntry(entry);
          onCloseMobile();
        }}
        className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer ${
          isSelected
            ? 'bg-zinc-900 border-amber-500/50 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20'
            : 'bg-zinc-900/40 hover:bg-zinc-900/80 border-zinc-800/80 hover:border-zinc-700/80'
        }`}
      >
        {/* Top row: Mode + Pin + Time */}
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
          <div className="flex items-center space-x-1.5">
            <span className="p-1 rounded-md bg-zinc-800 text-amber-400 border border-zinc-750">
              <ModeIcon className="w-3 h-3" />
            </span>
            <span className="capitalize text-[11px] font-medium text-zinc-300">
              {entry.mode.replace('_', ' ')}
            </span>
            {entry.pinned && <Pin className="w-3 h-3 text-amber-400 fill-amber-400" />}
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">{formatRelativeTime(entry.updatedAt || entry.createdAt)}</span>
        </div>

        {/* Title */}
        <h4 className="text-sm font-semibold text-zinc-100 line-clamp-1 mb-1 group-hover:text-amber-200 transition-colors">
          {entry.title || 'Untitled Reflection'}
        </h4>

        {/* Snippet */}
        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-2">
          {previewText}
        </p>

        {/* Bottom tags and message count */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1.5 border-t border-zinc-800/80">
          <div className="flex items-center space-x-1 overflow-hidden">
            <span className="font-mono text-zinc-400">{entry.messages.length} msg{entry.messages.length !== 1 ? 's' : ''}</span>
            {entry.tags && entry.tags.length > 0 && (
              <span className="truncate max-w-[110px] text-amber-400/80">
                • #{entry.tags.join(' #')}
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteEntry(entry.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-400 transition-opacity"
            title="Delete entry"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-20 w-80 bg-zinc-950/95 border-r border-zinc-850/80 flex flex-col h-full transform transition-transform duration-200 ease-in-out md:translate-x-0 backdrop-blur-xl ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-zinc-850/80 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-zinc-100">Reflection History</h3>
            <p className="text-xs text-zinc-400 font-mono">{entries.length} stored entries</p>
          </div>
          <button
            id="sidebar-new-entry-btn"
            onClick={() => {
              onNewEntry();
              onCloseMobile();
            }}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-750 text-amber-400 hover:bg-zinc-800 hover:text-amber-300 transition-colors shadow-sm cursor-pointer"
            title="Create New Reflection"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-zinc-850/80 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              id="search-entries-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search thoughts, tags..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-900/70 border border-zinc-800 rounded-xl text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
            />
          </div>

          {/* Mode Filter Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto pt-1 text-[11px]">
            {['all', 'reflection', 'brainstorm', 'action_plan', 'summary'].map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedModeFilter(mode)}
                className={`px-2.5 py-1 rounded-lg capitalize shrink-0 font-medium transition-all ${
                  selectedModeFilter === mode
                    ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-300 border border-zinc-800/60'
                }`}
              >
                {mode.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {entries.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 text-xs">
              <p>No reflections recorded yet.</p>
              <p className="mt-1 text-zinc-600">Click "New Reflection" to begin.</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 text-xs">
              <p>No reflections match your search query.</p>
            </div>
          ) : (
            <>
              {pinnedEntries.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-amber-400/80 uppercase tracking-wider mb-2 px-1 flex items-center space-x-1">
                    <Pin className="w-2.5 h-2.5" />
                    <span>Pinned Reflections</span>
                  </p>
                  <div className="space-y-2 mb-4">
                    {pinnedEntries.map(renderEntryCard)}
                  </div>
                </div>
              )}

              <div>
                {pinnedEntries.length > 0 && (
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-1">
                    All Reflections
                  </p>
                )}
                <div className="space-y-2">
                  {unpinnedEntries.map(renderEntryCard)}
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
};
