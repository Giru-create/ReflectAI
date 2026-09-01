export type ReflectionMode = 'reflection' | 'brainstorm' | 'summary' | 'action_plan';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  mode: ReflectionMode;
  tags: string[];
  messages: ChatMessage[];
  summary?: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
}

export interface UserStats {
  totalEntries: number;
  totalInteractions: number;
  modeBreakdown: Record<ReflectionMode, number>;
  latestEntryDate: number | null;
}

export interface GeminiGenerateRequest {
  messages: { role: 'user' | 'model'; content: string }[];
  mode?: ReflectionMode;
  context?: string;
  generateSummary?: boolean;
}

export interface GeminiGenerateResponse {
  reply: string;
  modelUsed: string;
  summary?: string;
  suggestedTitle?: string;
}
