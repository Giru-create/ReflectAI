import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  auth,
  signInWithGoogle,
  signOutUser,
  saveJournalEntry,
  deleteJournalEntry,
  subscribeToUserEntries,
} from './lib/firebase';
import { JournalEntry, ReflectionMode } from './types';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { EntryEditor } from './components/EntryEditor';
import { EntryList } from './components/EntryList';
import { StatsBar } from './components/StatsBar';
import { Menu, X, Sparkles, ShieldCheck } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<ReflectionMode>('reflection');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
      },
      (error) => {
        console.error('Firebase Auth state error:', error);
        setAuthError(error.message);
        setAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Real-time Firestore entries subscription
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setSelectedEntry(null);
      return;
    }

    const unsubscribe = subscribeToUserEntries(
      user.uid,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
        // If no entry is currently selected or current selected is not in list, select the newest or create draft
        setSelectedEntry((prev) => {
          if (prev) {
            const found = fetchedEntries.find((e) => e.id === prev.id);
            return found || prev;
          }
          if (fetchedEntries.length > 0) {
            return fetchedEntries[0];
          }
          return createDraftEntry(user.uid, activeMode);
        });
      },
      (err) => {
        setSaveError(`Failed to load entries from Firestore: ${err.message}`);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const createDraftEntry = (userId: string, mode: ReflectionMode = 'reflection'): JournalEntry => {
    return {
      id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      title: 'Untitled Reflection',
      mode,
      tags: [],
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false,
    };
  };

  const handleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setAuthError(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setSelectedEntry(null);
      setEntries([]);
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  const handleNewEntry = () => {
    if (!user) return;
    const newEntry = createDraftEntry(user.uid, activeMode);
    setSelectedEntry(newEntry);
    setIsMobileSidebarOpen(false);
  };

  const handleSelectEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setActiveMode(entry.mode);
    setIsMobileSidebarOpen(false);
  };

  const handleUpdateEntry = async (updatedEntry: JournalEntry) => {
    setSelectedEntry(updatedEntry);
    setSaveError(null);
    if (!user) return;

    setIsSaving(true);
    try {
      await saveJournalEntry(updatedEntry);
    } catch (err: any) {
      console.error('Firestore save failed:', err);
      setSaveError(err.message || 'Could not save entry to Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return;
    const confirmDelete = window.confirm('Are you sure you want to permanently delete this reflection?');
    if (!confirmDelete) return;

    try {
      await deleteJournalEntry(user.uid, entryId);
      if (selectedEntry?.id === entryId) {
        const remaining = entries.filter((e) => e.id !== entryId);
        if (remaining.length > 0) {
          setSelectedEntry(remaining[0]);
        } else {
          setSelectedEntry(createDraftEntry(user.uid, activeMode));
        }
      }
    } catch (err: any) {
      console.error('Delete entry failed:', err);
      setSaveError(`Failed to delete reflection: ${err.message}`);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4 p-8 rounded-2xl bg-zinc-900/60 border border-zinc-850 shadow-2xl backdrop-blur-xl">
          <div className="w-10 h-10 border-2 border-zinc-700 border-t-amber-400 rounded-full animate-spin mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-200">Verifying secure Firebase credentials</p>
            <p className="text-xs text-zinc-500 font-mono">Encrypted owner-bound session</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-amber-500/20 selection:text-amber-200">
      {/* Navigation Header */}
      <Navbar
        user={user}
        activeMode={activeMode}
        onSelectMode={setActiveMode}
        onNewEntry={handleNewEntry}
        onSignOut={handleSignOut}
        totalEntries={entries.length}
      />

      {/* Main Container */}
      {!user ? (
        <LandingPage
          onSignIn={handleSignIn}
          isLoading={authLoading}
          error={authError}
        />
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
          {/* Stats & Firestore Status Ribbon */}
          <StatsBar entries={entries} userEmail={user.email} />

          {/* Mobile Sidebar Toggle Button */}
          <div className="md:hidden bg-zinc-900/90 border-b border-zinc-800 px-4 py-2 flex items-center justify-between backdrop-blur-md">
            <button
              id="mobile-toggle-sidebar-btn"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="inline-flex items-center space-x-2 text-xs font-medium text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              {isMobileSidebarOpen ? <X className="w-4 h-4 text-amber-400" /> : <Menu className="w-4 h-4 text-amber-400" />}
              <span>History ({entries.length})</span>
            </button>

            <span className="text-xs font-mono text-zinc-400 truncate max-w-[200px]">
              {selectedEntry?.title || 'Reflection'}
            </span>
          </div>

          {/* Main Dashboard Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar History */}
            <EntryList
              entries={entries}
              selectedEntryId={selectedEntry?.id || null}
              onSelectEntry={handleSelectEntry}
              onNewEntry={handleNewEntry}
              onDeleteEntry={handleDeleteEntry}
              isOpenMobile={isMobileSidebarOpen}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />

            {/* Main Center Editor & Multi-turn Chat */}
            {selectedEntry ? (
              <EntryEditor
                entry={selectedEntry}
                onUpdateEntry={handleUpdateEntry}
                onDeleteEntry={handleDeleteEntry}
                isSaving={isSaving}
                saveError={saveError}
                onClearSaveError={() => setSaveError(null)}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center text-zinc-500 bg-zinc-950">
                <div className="max-w-xs p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/60">
                  <Sparkles className="w-8 h-8 mx-auto mb-3 text-amber-400/80 animate-pulse" />
                  <p className="text-sm font-medium text-zinc-300">No Reflection Selected</p>
                  <p className="text-xs text-zinc-500 mt-1">Select or create a reflection to begin conversing with Gemini.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
