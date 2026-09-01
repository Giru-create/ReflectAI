import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { motion } from 'motion/react';
import {
  Send,
  Sparkles,
  Brain,
  Lightbulb,
  ListChecks,
  FileText,
  Copy,
  Check,
  Pin,
  Trash2,
  Download,
  AlertCircle,
  Plus,
  Layers,
} from 'lucide-react';
import { JournalEntry, ChatMessage, ReflectionMode } from '../types';

interface EntryEditorProps {
  entry: JournalEntry;
  onUpdateEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  isSaving: boolean;
  saveError: string | null;
  onClearSaveError: () => void;
}

const PROMPT_SUGGESTIONS: Record<ReflectionMode, { label: string; prompt: string }[]> = {
  reflection: [
    {
      label: '🌱 Mental Clarity Check',
      prompt: 'I have a lot on my mind today regarding my current priorities. Help me untangle what is truly important versus what is just urgent noise.',
    },
    {
      label: '⚖️ Difficult Decision',
      prompt: 'I am wrestling with a tough decision between two distinct paths. Help me evaluate my core values, potential second-order consequences, and hidden biases.',
    },
    {
      label: '✨ Gratitude & Energy',
      prompt: 'Reflecting on three moments from this week that gave me genuine energy and what they teach me about how I want to spend my time.',
    },
  ],
  brainstorm: [
    {
      label: '💡 Lateral Solutions',
      prompt: 'Here is a roadblock I am facing: [describe issue]. Generate 5 unconventional angles and creative solutions I might be overlooking.',
    },
    {
      label: '🚀 Project Expansion',
      prompt: 'I want to brainstorm innovative features or marketing initiatives for my new project to create a truly memorable user experience.',
    },
    {
      label: '🎯 10x Thinking',
      prompt: 'If I had 10x the resources, or conversely had to solve this in 24 hours, what would the radical approach look like?',
    },
  ],
  action_plan: [
    {
      label: '📋 48-Hour Sprint',
      prompt: 'Break down my goal for this week into concrete 24-48 hour actionable milestones with explicit friction mitigations.',
    },
    {
      label: '⚡ Overcoming Procrastination',
      prompt: 'I keep avoiding a specific task. Help me break it down into a microscopic first step and design an accountability trigger.',
    },
    {
      label: '🧭 Strategic Roadmap',
      prompt: 'Synthesize my notes into a structured 3-phase execution roadmap with measurable key results.',
    },
  ],
  summary: [
    {
      label: '📝 Weekly Synthesis',
      prompt: 'Synthesize my main thoughts, recurring themes, and progress from this past week into key executive takeaways.',
    },
    {
      label: '🔍 Core Dilemmas',
      prompt: 'Extract the central dilemmas and underlying beliefs from my journal entry.',
    },
    {
      label: '💡 Key Insights Extraction',
      prompt: 'Summarize the top 3 actionable principles I should carry forward from this experience.',
    },
  ],
};

export const EntryEditor: React.FC<EntryEditorProps> = ({
  entry,
  onUpdateEntry,
  onDeleteEntry,
  isSaving,
  saveError,
}) => {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [modelBadge, setModelBadge] = useState<string>('gemini-3.6-flash');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entry.messages, isGenerating]);

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputText]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleModeChange = (mode: ReflectionMode) => {
    onUpdateEntry({
      ...entry,
      mode,
    });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateEntry({
      ...entry,
      title: e.target.value,
    });
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim().toLowerCase();
    if (trimmed && !entry.tags.includes(trimmed)) {
      onUpdateEntry({
        ...entry,
        tags: [...entry.tags, trimmed],
      });
    }
    setNewTagInput('');
    setShowTagInput(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateEntry({
      ...entry,
      tags: entry.tags.filter((t) => t !== tagToRemove),
    });
  };

  const handleTogglePin = () => {
    onUpdateEntry({
      ...entry,
      pinned: !entry.pinned,
    });
  };

  const handleExportMarkdown = () => {
    let md = `# ${entry.title || 'Untitled Reflection'}\n\n`;
    md += `**Date**: ${new Date(entry.createdAt).toLocaleDateString()} | **Mode**: ${entry.mode}\n`;
    if (entry.tags.length > 0) {
      md += `**Tags**: ${entry.tags.map((t) => `#${t}`).join(' ')}\n\n`;
    }
    if (entry.summary) {
      md += `### Executive Summary\n${entry.summary}\n\n`;
    }
    md += `## Multi-Turn Dialogue\n\n`;
    entry.messages.forEach((msg) => {
      md += `### ${msg.role === 'user' ? '👤 User Reflection' : '✨ Gemini Response'} (${new Date(
        msg.timestamp
      ).toLocaleTimeString()})\n\n${msg.content}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(entry.title || 'reflection').toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isGenerating) return;

    setGenerationError(null);
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const updatedMessages = [...entry.messages, userMessage];

    // Auto-update title if it's the first message and still "Untitled Reflection"
    let updatedTitle = entry.title;
    if (entry.messages.length === 0 && entry.title === 'Untitled Reflection') {
      const words = text.split(' ').slice(0, 5).join(' ');
      updatedTitle = words.length > 30 ? `${words.slice(0, 30)}...` : words;
    }

    const nextEntryState: JournalEntry = {
      ...entry,
      title: updatedTitle,
      messages: updatedMessages,
    };

    // Optimistically update entry state and trigger Firestore save
    onUpdateEntry(nextEntryState);
    setInputText('');
    setIsGenerating(true);

    try {
      const response = await fetch('/api/gemini/converse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          mode: entry.mode,
          generateSummary: updatedMessages.length >= 2,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      if (data.modelUsed) {
        setModelBadge(data.modelUsed);
      }

      const modelMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        role: 'model',
        content: data.reply,
        timestamp: Date.now(),
      };

      const finalMessages = [...updatedMessages, modelMessage];
      const finalEntry: JournalEntry = {
        ...nextEntryState,
        title: data.suggestedTitle && entry.title === 'Untitled Reflection' ? data.suggestedTitle : nextEntryState.title,
        summary: data.summary || nextEntryState.summary,
        messages: finalMessages,
      };

      onUpdateEntry(finalEntry);
    } catch (err: any) {
      console.error('Error generating Gemini response:', err);
      setGenerationError(err.message || 'Failed to connect to Gemini. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 relative overflow-hidden text-zinc-100">
      {/* Workspace Header Toolbar */}
      <div className="border-b border-zinc-850/80 px-4 sm:px-6 py-3 bg-zinc-900/50 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        {/* Title */}
        <div className="flex-1 min-w-[260px] flex items-center space-x-3">
          <input
            id="entry-title-input"
            type="text"
            value={entry.title}
            onChange={handleTitleChange}
            placeholder="Reflection Title..."
            className="text-lg font-semibold text-zinc-100 bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-amber-400 focus:outline-none px-1 py-0.5 w-full max-w-md transition-colors"
          />
        </div>

        {/* Action icons & Save status */}
        <div className="flex items-center space-x-2">
          {/* Persistence status indicator */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-300">
            {isSaving ? (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-amber-300">Syncing Firestore...</span>
              </>
            ) : saveError ? (
              <span className="text-rose-400 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Save Failed</span>
              </span>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-emerald-300">Firestore Synced</span>
              </>
            )}
          </div>

          {/* Pin toggle */}
          <button
            id="pin-entry-btn"
            onClick={handleTogglePin}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              entry.pinned
                ? 'bg-amber-400/15 border-amber-400/40 text-amber-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
            title={entry.pinned ? 'Unpin reflection' : 'Pin reflection'}
          >
            <Pin className={`w-4 h-4 ${entry.pinned ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Export Markdown */}
          <button
            id="export-entry-btn"
            onClick={handleExportMarkdown}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors cursor-pointer"
            title="Export as Markdown"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            id="delete-entry-btn"
            onClick={() => onDeleteEntry(entry.id)}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-rose-400/80 hover:text-rose-300 hover:border-rose-900 hover:bg-rose-950/30 transition-colors cursor-pointer"
            title="Delete reflection"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Selector & Tags Ribbon */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-zinc-850/60 bg-zinc-900/30 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
          <span className="text-zinc-400 font-medium mr-1 flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <span>Mode:</span>
          </span>
          {(
            [
              { mode: 'reflection', label: 'Reflection', icon: Brain },
              { mode: 'brainstorm', label: 'Brainstorm', icon: Lightbulb },
              { mode: 'action_plan', label: 'Action Plan', icon: ListChecks },
              { mode: 'summary', label: 'Summary', icon: FileText },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const isActive = entry.mode === item.mode;
            return (
              <button
                key={item.mode}
                id={`mode-btn-${item.mode}`}
                onClick={() => handleModeChange(item.mode)}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30 shadow-sm'
                    : 'bg-zinc-900/90 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200 border border-zinc-800/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tags & Metadata */}
        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-zinc-900 text-amber-300 border border-zinc-750 text-[11px]"
            >
              <span>#{tag}</span>
              <button
                onClick={() => handleRemoveTag(tag)}
                className="text-zinc-400 hover:text-zinc-200 ml-1 cursor-pointer"
              >
                ×
              </button>
            </span>
          ))}

          {showTagInput ? (
            <div className="inline-flex items-center space-x-1">
              <input
                id="add-tag-input"
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="tag name"
                className="w-20 px-2 py-0.5 text-[11px] bg-zinc-900 border border-zinc-700 rounded-md text-zinc-200 focus:outline-none focus:border-amber-400"
                autoFocus
              />
              <button
                id="confirm-tag-btn"
                onClick={handleAddTag}
                className="text-[11px] px-2 py-0.5 bg-amber-500 text-zinc-950 font-medium rounded-md cursor-pointer"
              >
                Add
              </button>
            </div>
          ) : (
            <button
              id="show-tag-input-btn"
              onClick={() => setShowTagInput(true)}
              className="inline-flex items-center space-x-1 text-zinc-400 hover:text-amber-400 text-[11px] px-2 py-0.5 rounded border border-dashed border-zinc-800 hover:border-zinc-700 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Tag</span>
            </button>
          )}
        </div>
      </div>

      {/* Save Error Alert Banner with Retry */}
      {saveError && (
        <div className="bg-rose-950/60 border-b border-rose-800/80 px-4 py-2.5 flex items-center justify-between text-xs text-rose-200 backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>Database synchronization error: {saveError}</span>
          </div>
          <button
            onClick={() => onUpdateEntry({ ...entry })}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-md text-xs font-semibold cursor-pointer"
          >
            Retry Save
          </button>
        </div>
      )}

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* If empty, show welcome guide & prompts catalog */}
        {entry.messages.length === 0 ? (
          <div className="max-w-2xl mx-auto py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 text-amber-400 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-black/40">
              <Sparkles className="w-7 h-7 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-zinc-100 mb-2">
              Begin Your Multi-Turn Reflection
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mb-8 max-w-md mx-auto leading-relaxed">
              Write freely about your day, a complex problem, or a breakthrough. Gemini will synthesize and provide structured perspectives.
            </p>

            {/* Prompt Catalyst Chips */}
            <div className="text-left bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 shadow-lg">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Prompt Suggestions ({entry.mode.replace('_', ' ')})
              </p>
              <div className="space-y-2.5">
                {PROMPT_SUGGESTIONS[entry.mode].map((item, idx) => (
                  <button
                    key={idx}
                    id={`suggestion-chip-${idx}`}
                    onClick={() => handleSendMessage(item.prompt)}
                    className="w-full text-left p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-850/80 transition-all text-xs text-zinc-300 flex items-start justify-between group cursor-pointer"
                  >
                    <div>
                      <span className="font-semibold text-zinc-100 block mb-1 group-hover:text-amber-200 transition-colors">
                        {item.label}
                      </span>
                      <span className="text-zinc-400 line-clamp-2 leading-relaxed">{item.prompt}</span>
                    </div>
                    <Send className="w-3.5 h-3.5 text-zinc-600 group-hover:text-amber-400 ml-3 mt-1 shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {entry.messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  {/* Speaker Label */}
                  <div className="flex items-center space-x-2 mb-1.5 px-1 text-xs text-zinc-400">
                    {isUser ? (
                      <>
                        <span className="font-medium text-zinc-300">You (Reflection)</span>
                        <span>•</span>
                        <span className="font-mono text-[11px] text-zinc-400">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center space-x-1 text-amber-400 font-medium">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Gemini AI</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-850 border border-zinc-750 text-amber-300/80 font-mono">
                          {modelBadge}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[11px] text-zinc-400">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`relative group max-w-full sm:max-w-[88%] rounded-2xl p-4.5 sm:p-5 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-zinc-850 text-zinc-100 border border-zinc-750/80 shadow-lg shadow-black/20'
                        : 'bg-zinc-900/80 border border-zinc-800 text-zinc-200 shadow-lg shadow-black/20 backdrop-blur-sm'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="prose prose-invert prose-sm max-w-none [&>h1]:text-base [&>h2]:text-sm [&>h2]:font-bold [&>h2]:mt-3 [&>h2]:mb-1.5 [&>h2]:text-zinc-100 [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:text-zinc-200 [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:my-2 [&>p]:my-2 [&>p]:text-zinc-300 [&>blockquote]:border-l-2 [&>blockquote]:border-amber-400 [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:text-zinc-400">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    )}

                    {/* Copy action */}
                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-zinc-800/90 border border-zinc-700 text-zinc-300 hover:text-white shadow-md cursor-pointer"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Generation Spinner Bubble */}
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-start"
              >
                <div className="flex items-center space-x-2 mb-1 px-1 text-xs text-zinc-400">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span className="font-medium text-amber-300">Gemini is synthesizing reflection...</span>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs flex items-center space-x-3 shadow-lg">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="font-mono text-zinc-400 text-[11px]">Connecting fallback ladder (gemini-3.6-flash)...</span>
                </div>
              </motion.div>
            )}

            {/* Generation Error Banner */}
            {generationError && (
              <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start justify-between shadow-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-rose-100">AI Interaction Issue</p>
                    <p className="mt-0.5 text-rose-300">{generationError}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleSendMessage()}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold shrink-0 ml-3 cursor-pointer"
                >
                  Retry Prompt
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Box Footer */}
      <div className="border-t border-zinc-850/80 p-4 bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto">
          <div className="relative border border-zinc-800 focus-within:border-amber-500/60 focus-within:ring-1 focus-within:ring-amber-500/20 rounded-2xl bg-zinc-900/60 p-2.5 transition-all shadow-xl shadow-black/20">
            <textarea
              id="reflection-input-textarea"
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Write your thoughts in ${entry.mode.replace('_', ' ')} mode... (Press Ctrl+Enter or Cmd+Enter to send)`}
              rows={2}
              className="w-full bg-transparent resize-none focus:outline-none text-sm text-zinc-100 placeholder:text-zinc-500 px-2 py-1 leading-relaxed"
            />

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 px-1">
              <div className="flex items-center space-x-2 text-[11px] text-zinc-500 font-mono">
                <span>Ctrl + Enter to send</span>
              </div>

              <button
                id="send-reflection-btn"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isGenerating}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-zinc-950 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-amber-500/10 cursor-pointer active:scale-[0.98]"
              >
                <span>Reflect</span>
                <Send className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
