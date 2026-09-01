import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Standard Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Lazy Google Gen AI initialization
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Resilient Model Fallback Ladder
const MODEL_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

interface FallbackOptions {
  systemInstruction?: string;
  contents: any;
  temperature?: number;
}

async function generateContentWithFallback(options: FallbackOptions): Promise<{ text: string; modelUsed: string }> {
  const ai = getGenAI();
  let lastError: any = null;

  for (const model of MODEL_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature ?? 0.7,
        },
      });

      const text = response.text || '';
      return { text, modelUsed: model };
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      const isRecoverable =
        errMsg.includes('503') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('404') ||
        errMsg.includes('NOT_FOUND') ||
        errMsg.includes('500') ||
        errMsg.includes('INTERNAL');

      console.warn(`[Gemini Fallback] Model ${model} failed (recoverable: ${isRecoverable}): ${errMsg}`);
      if (!isRecoverable && !errMsg.includes('fetch failed')) {
        // Continue trying next model anyway to maximize resilience
      }
    }
  }

  throw new Error(`All Gemini models in fallback ladder failed. Root cause: ${lastError?.message || 'Unknown error'}`);
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Multi-turn Conversational AI with Reflective Intelligence
app.post('/api/gemini/converse', async (req: Request, res: Response) => {
  try {
    // Defensive Payload Ingestion (Null-Safe Destructuring)
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const mode = typeof body.mode === 'string' ? body.mode : 'reflection';
    const generateSummary = Boolean(body.generateSummary);

    if (messages.length === 0) {
      return res.status(400).json({ error: 'Missing or empty messages array in request body.' });
    }

    // System prompt tailored to reflective mode
    let systemInstruction = `You are a thoughtful, empathetic, and highly perceptive AI Journaling & Reflection Companion.
Your role is to help the user unpack their thoughts, examine cognitive biases, celebrate milestones, and find clarity without ever being dismissive or preachy.
Format your responses with clear Markdown (bold keywords, neat bullet points, concise thought-provoking reflection questions, and section breaks where appropriate). Keep responses encouraging, articulate, and well-structured.`;

    if (mode === 'brainstorm') {
      systemInstruction = `You are an inventive creative brainstorming partner and strategic catalyst.
Analyze the user's reflection or challenge and generate high-impact ideas, alternative angles, lateral connections, and provocative questions to inspire divergent thinking.
Use structured Markdown headers, bullet points, and prioritized recommendations.`;
    } else if (mode === 'action_plan') {
      systemInstruction = `You are an executive clarity coach and practical strategist.
Transform the user's reflections and thoughts into concrete, realistic, and prioritized action steps.
Highlight:
1. Key Insight / Core Focus
2. Immediate Next Steps (Next 24-48 Hours)
3. Medium-Term Milestones
4. Potential Obstacles & Mitigation Strategies
Keep it crisp, actionable, and structured with Markdown.`;
    } else if (mode === 'summary') {
      systemInstruction = `You are an insightful summarization specialist.
Provide an elegant, synthesized overview of the user's entry, extracting recurring themes, emotional undertones, key dilemmas, and core takeaways in a clear, digestible format with Markdown bullets.`;
    }

    // Transform chat messages to Gemini contents format
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: String(m.content || '') }],
    }));

    const result = await generateContentWithFallback({
      systemInstruction,
      contents,
      temperature: mode === 'brainstorm' ? 0.85 : 0.65,
    });

    let summary: string | undefined = undefined;
    let suggestedTitle: string | undefined = undefined;

    // Optional auxiliary synthesis (title/summary) for first turn or on request
    if (generateSummary || messages.length === 1) {
      try {
        const synthPrompt = `Based on the following journal conversation, return a JSON object with:
1. "title": A concise, meaningful 3-6 word title capturing the essence.
2. "summary": A 1-2 sentence executive summary of the entry.

Conversation:
${messages.map((m: { role: string; content: string }) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}
MODEL: ${result.text}

Return strictly JSON matching this format: {"title": "...", "summary": "..."}`;

        const synthResult = await generateContentWithFallback({
          contents: [{ role: 'user', parts: [{ text: synthPrompt }] }],
          temperature: 0.3,
        });

        const cleanJson = synthResult.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        suggestedTitle = parsed.title;
        summary = parsed.summary;
      } catch (err) {
        // Non-blocking fallback for title/summary
        console.warn('Synthesis extraction note:', err);
      }
    }

    return res.json({
      reply: result.text,
      modelUsed: result.modelUsed,
      suggestedTitle,
      summary,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/converse:', error);
    return res.status(500).json({
      error: error.message || 'An unexpected error occurred while communicating with Gemini.',
    });
  }
});

// Single prompt quick reflection/summarization
app.post('/api/gemini/summarize', async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const text = typeof body.text === 'string' ? body.text : '';

    if (!text.trim()) {
      return res.status(400).json({ error: 'Text parameter is required.' });
    }

    const prompt = `Analyze the following reflection or journal entry. Provide:
1. Executive Summary (2-3 sentences)
2. Core Emotional/Mental Themes (3-4 bullet points)
3. Three Deep Reflection Questions for future contemplation

Entry:
${text}`;

    const result = await generateContentWithFallback({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      temperature: 0.5,
    });

    return res.json({
      summary: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/summarize:', error);
    return res.status(500).json({
      error: error.message || 'An unexpected error occurred during summarization.',
    });
  }
});

// Vite middleware or static serving
async function setupApp() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ReflectAI Server running on port ${PORT}`);
  });
}

setupApp();
