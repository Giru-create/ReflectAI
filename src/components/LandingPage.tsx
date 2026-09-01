import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Sparkles, Brain, Lock, ArrowRight, History } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
  isLoading: boolean;
  error?: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn, isLoading, error }) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between bg-zinc-950 text-zinc-100 relative overflow-hidden">
      {/* Subtle ambient lighting effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Hero Section */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-750 text-amber-300 text-xs font-medium mb-8 shadow-inner backdrop-blur-md"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Powered by Gemini 3.6 Flash & Cloud Firestore</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-100 max-w-3xl mx-auto leading-[1.15]"
        >
          Your Private Multi-Turn{' '}
          <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
            Reflection Partner
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal"
        >
          Unpack complex thoughts, brainstorm strategic directions, and extract actionable clarity with Gemini.
          Every thought is strictly isolated to your authenticated account in Cloud Firestore.
        </motion.p>

        {/* Error Notification */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-4 max-w-md mx-auto rounded-2xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-sm text-left backdrop-blur-md"
          >
            <p className="font-semibold mb-1">Authentication Notice</p>
            <p className="text-rose-300 text-xs">{error}</p>
          </motion.div>
        )}

        {/* Sign In CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            id="google-sign-in-btn"
            onClick={onSignIn}
            disabled={isLoading}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-bold text-base shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center space-x-3 disabled:opacity-60 cursor-pointer active:scale-[0.98]"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.42 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.58 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Sign in with Google</span>
                <ArrowRight className="w-4 h-4 text-zinc-950 stroke-[2.5]" />
              </>
            )}
          </button>
        </motion.div>

        {/* Security badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-zinc-900/60 border border-zinc-800">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero Password Storage</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-zinc-900/60 border border-zinc-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Owner-Bound Firestore Rules</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-zinc-900/60 border border-zinc-800">
            <Brain className="w-3.5 h-3.5 text-amber-400" />
            <span>Gemini Multi-Turn Synthesis</span>
          </div>
        </div>
      </div>

      {/* Feature Pillars */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-zinc-850/80">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/80 transition-all shadow-lg shadow-black/20 backdrop-blur-md group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Brain className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-zinc-100 mb-2">Deep Reflection & Unpacking</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Converse with Gemini to challenge assumptions, explore emotional clarity, and gain perspective on daily dilemmas.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/80 transition-all shadow-lg shadow-black/20 backdrop-blur-md group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-zinc-100 mb-2">Strict User Isolation</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every document is strictly partitioned in Firestore under your unique authenticated UID with verified security rules.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/80 transition-all shadow-lg shadow-black/20 backdrop-blur-md group">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <History className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-zinc-100 mb-2">Continuous Multi-Turn History</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Re-visit past reflections anytime, search across your thought logs, and resume multi-turn dialogues seamlessly.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-zinc-850/80 bg-zinc-950/80 text-center text-xs text-zinc-400">
        <p>ReflectAI • Engineered with Google Gemini & Firebase Firestore Security</p>
      </footer>
    </div>
  );
};
