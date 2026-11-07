'use client';

import React, { useState } from 'react';
import MemoryPanel, { MemoryItem } from '../../components/MemoryPanel';
import { Send, ToggleLeft, ToggleRight, Sparkles, Bot, Users, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';

const DEMO_QUERIES = [
  "What was that shortcut explanation for dynamic programming we talked about last month?",
  "Why did we fail the graph quiz?",
  "What should I practice before the midterm?",
  "Why does Dijkstra not work with negative edges?",
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AskPage() {
  const [question, setQuestion] = useState('');
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Results
  const [memoryAnswer, setMemoryAnswer] = useState<string | null>(null);
  const [genericAnswer, setGenericAnswer] = useState<string | null>(null);
  const [recalledMemories, setRecalledMemories] = useState<MemoryItem[]>([]);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [highlightMemory, setHighlightMemory] = useState(false);

  const handleAsk = async (qText?: string) => {
    const q = (qText || question).trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setHighlightMemory(false);

    try {
      if (compareMode) {
        // Run both memory=false and memory=true requests
        const [genRes, memRes] = await Promise.all([
          fetch(`${API_BASE}/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: q, memory: false }),
          }),
          fetch(`${API_BASE}/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: q, memory: true }),
          }),
        ]);

        if (!genRes.ok || !memRes.ok) {
          throw new Error('Failed to retrieve response from API.');
        }

        const genData = await genRes.json();
        const memData = await memRes.json();

        setGenericAnswer(genData.answer);
        setMemoryAnswer(memData.answer);
        setRecalledMemories(memData.memories || []);
      } else {
        // Run single request based on memoryEnabled toggle
        const res = await fetch(`${API_BASE}/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: q, memory: memoryEnabled }),
        });

        if (!res.ok) {
          throw new Error('Failed to retrieve response from API.');
        }

        const data = await res.json();
        if (memoryEnabled) {
          setMemoryAnswer(data.answer);
          setGenericAnswer(null);
          setRecalledMemories(data.memories || []);
        } else {
          setGenericAnswer(data.answer);
          setMemoryAnswer(null);
          setRecalledMemories([]);
        }
      }

      setHasAnswered(true);
      // Trigger highlight animation for memory panel
      setHighlightMemory(true);
      setTimeout(() => setHighlightMemory(false), 2500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (demoQ: string) => {
    setQuestion(demoQ);
    handleAsk(demoQ);
  };

  return (
    <div className="space-y-8">
      {/* Title & Mode Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Ask RecallRoom
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Query the DSA group memory or compare with standard generic AI responses
          </p>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm self-start sm:self-auto">
          {/* Memory On/Off Switch */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Memory:</span>
            <button
              onClick={() => setMemoryEnabled(!memoryEnabled)}
              disabled={compareMode}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                compareMode
                  ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                  : memoryEnabled
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {memoryEnabled ? (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ON</span>
                </>
              ) : (
                <span>OFF</span>
              )}
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Compare Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Compare Mode:</span>
            <button
              onClick={() => {
                const nextVal = !compareMode;
                setCompareMode(nextVal);
                if (nextVal) {
                  setMemoryEnabled(true);
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                compareMode
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {compareMode ? 'Active (Side by Side)' : 'Off'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left is Question & Answers, Right is Persistent Memory Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 or 8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Question Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Your Question to the Study Group
            </label>
            <div className="relative">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about a shortcut, why someone failed a quiz, or what to practice..."
                rows={3}
                className="w-full rounded-xl border border-slate-200 p-3.5 pr-28 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
              />
              <button
                onClick={() => handleAsk()}
                disabled={loading || !question.trim()}
                className="absolute bottom-3 right-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Ask</span>
              </button>
            </div>

            {/* Clickable Demo Questions */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-slate-500">Try clickable demo questions:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEMO_QUERIES.map((dq, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectDemo(dq)}
                    className="text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/50 hover:border-indigo-300 transition text-xs text-slate-700 leading-snug group flex items-start justify-between gap-2"
                  >
                    <span>{dq}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
              <div>
                <p className="font-semibold">Error calling API</p>
                <p className="text-xs text-red-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Answers Section */}
          {hasAnswered && (
            <div className="space-y-4">
              {compareMode ? (
                /* Side by Side Comparison */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Generic AI Box */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">Generic AI</h3>
                          <p className="text-[11px] text-slate-500">Without memory context</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        Memory OFF
                      </span>
                    </div>
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {genericAnswer}
                    </div>
                  </div>

                  {/* RecallRoom Memory Box */}
                  <div className="rounded-2xl border-2 border-indigo-400 bg-indigo-50/20 p-5 shadow-md shadow-indigo-100 space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-sm">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-indigo-950">RecallRoom</h3>
                          <p className="text-[11px] text-indigo-600">Grounded in group memory</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                        Memory ON
                      </span>
                    </div>
                    <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                      {memoryAnswer}
                    </div>
                  </div>
                </div>
              ) : (
                /* Single Answer View */
                <div
                  className={`rounded-2xl p-6 border shadow-sm space-y-4 ${
                    memoryEnabled
                      ? 'border-indigo-300 bg-white shadow-indigo-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-lg ${
                          memoryEnabled
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {memoryEnabled ? (
                          <Users className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {memoryEnabled ? 'RecallRoom Answer' : 'Generic AI Answer'}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {memoryEnabled
                            ? 'Attributed to peer explanations and quiz outcomes'
                            : 'Standard answer without group memory'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        memoryEnabled
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {memoryEnabled ? 'Memory ON' : 'Memory OFF'}
                    </span>
                  </div>

                  <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {memoryEnabled ? memoryAnswer : genericAnswer}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Persistent Memory Panel (5 or 4 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-24">
          <MemoryPanel
            memories={recalledMemories}
            highlight={highlightMemory}
            isLoading={loading}
          />
        </div>
      </div>
    </div>
  );
}

