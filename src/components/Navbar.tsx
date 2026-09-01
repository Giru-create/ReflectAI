import React from 'react';
import { User } from 'firebase/auth';
import { Sparkles, LogOut, ShieldCheck, Plus } from 'lucide-react';
import { ReflectionMode } from '../types';

interface NavbarProps {
  user: User | null;
  activeMode: ReflectionMode;
  onSelectMode: (mode: ReflectionMode) => void;
  onNewEntry: () => void;
  onSignOut: () => void;
  totalEntries: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onNewEntry,
  onSignOut,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-850/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/60 text-amber-400 flex items-center justify-center shadow-lg shadow-black/40">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-lg text-zinc-100 tracking-tight">ReflectAI</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 font-mono">
                Gemini 3.6
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">Intelligent Journal & Reflection Workspace</p>
          </div>
        </div>

        {/* Center Actions (when logged in) */}
        {user && (
          <div className="flex items-center space-x-2">
            <button
              id="nav-new-entry-btn"
              onClick={onNewEntry}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 hover:text-black transition-all text-sm font-semibold shadow-lg shadow-amber-500/10 active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">New Reflection</span>
            </button>
          </div>
        )}

        {/* User Profile & Auth Controls */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-zinc-200 truncate max-w-[160px]">
                  {user.displayName || 'Reflective Mind'}
                </p>
                <div className="flex items-center justify-end space-x-1 text-[11px] text-zinc-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Firestore Isolated</span>
                </div>
              </div>

              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-9 h-9 rounded-full border border-zinc-700/80 object-cover shadow-sm ring-1 ring-zinc-800"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 text-amber-400 flex items-center justify-center font-medium text-sm">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}

              <button
                id="sign-out-button"
                onClick={onSignOut}
                title="Sign Out"
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850/80 transition-colors border border-transparent hover:border-zinc-800"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-xs text-zinc-400 flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Private & Encrypted</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
