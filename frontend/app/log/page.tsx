'use client';

import React, { useState } from 'react';
import { Send, FileText, CheckCircle2, AlertCircle, RefreshCw, Sparkles, Tag, User } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const SAMPLE_CHAT = `Sneha: During the mock test, I totally bombed the directed cycle detection question again. I thought we could just keep a visited set like in undirected graphs, but that falsely flags cross-edges as cycles!
Rahul: Remember what I said earlier: in directed graphs you need a recursion stack (in-progress set) or 3-color DFS (white/gray/black). A visited node is only a cycle if it is in the CURRENT DFS stack.`;

export default function LogPage() {
  const [author, setAuthor] = useState('Sneha');
  const [chatText, setChatText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storedItems, setStoredItems] = useState<any[] | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, text: chatText }),
      });

      if (!res.ok) {
        throw new Error('Failed to log session');
      }

      const data = await res.json();
      setStoredItems(data.stored || []);
      setChatText('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error communicating with backend');
    } finally {
      setLoading(false);
    }
  };

  const handleUseSample = () => {
    setChatText(SAMPLE_CHAT);
    setAuthor('Sneha');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <FileText className="w-8 h-8 text-indigo-600" />
          Log Study Session
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Paste study group chat snippets. Groq LLM extracts structured items and retains them into Hindsight memory.
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Primary Author:
            </label>
            <select
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Sneha">Sneha</option>
              <option value="Rahul">Rahul</option>
              <option value="Priya">Priya</option>
              <option value="Aman">Aman</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleUseSample}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2 flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load sample chat snippet</span>
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Paste Group Chat or Notes
          </label>
          <textarea
            value={chatText}
            onChange={(e) => setChatText(e.target.value)}
            placeholder="Paste raw conversation, peer explanation, doubt, or quiz score..."
            rows={6}
            className="w-full rounded-xl border border-slate-200 p-3.5 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !chatText.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Extracting &amp; Retaining...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Log to Hindsight Memory</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Extracted & Stored Results */}
      {storedItems && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Retained in Hindsight ({storedItems.length} {storedItems.length === 1 ? 'item' : 'items'})
            </h2>
            <span className="text-xs text-slate-500">Live Memory Updated</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {storedItems.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2 text-sm shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-slate-800 border border-slate-200">
                      <User className="w-3 h-3 text-slate-400" />
                      {item.author}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded font-semibold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                      {item.type}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      topic: {item.topic}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">Retained just now</span>
                </div>

                <p className="text-slate-800 font-medium text-sm leading-relaxed">
                  {item.content}
                </p>

                <div className="pt-2 flex flex-wrap gap-1.5 border-t border-emerald-100">
                  {item.tags?.map((t: string, tIdx: number) => (
                    <span
                      key={tIdx}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200"
                    >
                      <Tag className="w-2.5 h-2.5 text-slate-400" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

