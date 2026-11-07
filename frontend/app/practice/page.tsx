'use client';

import React, { useState } from 'react';
import { Target, User, Sparkles, RefreshCw, AlertCircle, Bookmark, CheckCircle2 } from 'lucide-react';

const MEMBERS = ['Sneha', 'Rahul', 'Priya', 'Aman'];
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PracticeResult {
  user: string;
  topic: string;
  question: string;
  justification: string;
}

export default function PracticePage() {
  const [selectedUser, setSelectedUser] = useState('Sneha');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PracticeResult | null>(null);

  const handleGenerate = async (targetUser?: string) => {
    const userToQuery = targetUser || selectedUser;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/practice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: userToQuery }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate practice question');
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error communicating with backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Target className="w-8 h-8 text-indigo-600" />
          Targeted Practice Generator
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Hindsight identifies each member&apos;s weakest topics and failed quiz questions to generate hyper-relevant prep.
        </p>
      </div>

      {/* Member Selection Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
          Select Study Group Member
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MEMBERS.map((member) => {
            const isSelected = selectedUser === member;
            return (
              <button
                key={member}
                onClick={() => {
                  setSelectedUser(member);
                  handleGenerate(member);
                }}
                className={`p-3.5 rounded-xl border text-sm font-semibold transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm ring-2 ring-indigo-200'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {member[0]}
                  </div>
                  <span>{member}</span>
                </div>
                {member === 'Sneha' && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">
                    Demo
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => handleGenerate()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Scanning Memories &amp; Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Targeted Practice for {selectedUser}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-6 pt-2">
          {/* Why this was chosen (Justification Card) */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
              <Bookmark className="w-4 h-4 text-amber-600" />
              <span>Hindsight Memory Justification</span>
            </div>
            <p className="text-sm text-amber-950 font-medium leading-relaxed">
              {result.justification}
            </p>
            <div className="pt-1 flex items-center gap-2 text-xs text-amber-700">
              <span className="font-semibold capitalize">Target Topic: {result.topic}</span>
              <span>&bull;</span>
              <span>Selected from past quiz mistakes &amp; doubts</span>
            </div>
          </div>

          {/* Generated Question Card */}
          <div className="bg-white rounded-2xl border-2 border-indigo-200 p-6 sm:p-8 shadow-md shadow-indigo-50 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                  <Target className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  Practice Challenge for {result.user}
                </h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                {result.topic}
              </span>
            </div>

            <div className="text-sm sm:text-base text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
              {result.question}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Tailored to overcome specific mistake in group record</span>
              <span className="text-indigo-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready for test
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

