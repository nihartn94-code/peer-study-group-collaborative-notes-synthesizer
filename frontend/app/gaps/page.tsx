'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';
import { BarChart2, Users, AlertTriangle, Lightbulb, RefreshCw, CheckCircle2 } from 'lucide-react';

interface TopicGap {
  topic: string;
  fail_count: number;
  members: string[];
}

interface GapData {
  topics: TopicGap[];
  insight: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#6366f1', '#8b5cf6'];

export default function GapMapPage() {
  const [data, setData] = useState<GapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGaps = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/gaps`);
      if (!res.ok) {
        throw new Error('Failed to fetch gaps data');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGaps();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart2 className="w-8 h-8 text-indigo-600" />
            Group Gap Map
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Aggregated quiz failures and Hindsight mental model of collective study weaknesses
          </p>
        </div>

        <button
          onClick={fetchGaps}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition shadow-sm self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">
            Synthesizing quiz results and running Hindsight mental model query...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>Could not load Gap Map</span>
          </div>
          <p className="text-xs text-red-600">{error}</p>
          <button
            onClick={fetchGaps}
            className="mt-2 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Row: Chart & Topic Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Chart Container */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Quiz Failure Frequency by Topic</h3>
                  <p className="text-xs text-slate-500">Based on retained quiz attempts tagged outcome:fail</p>
                </div>
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                  Target Areas
                </span>
              </div>

              {data?.topics && data.topics.length > 0 ? (
                <div className="h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.topics}
                      margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="topic"
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={{ stroke: '#cbd5e1' }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={{ stroke: '#cbd5e1' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: '12px',
                        }}
                        formatter={(value: any, name: any, item: any) => [
                          `${value} failed attempts (${item.payload.members.join(', ')})`,
                          'Failures',
                        ]}
                      />
                      <Bar dataKey="fail_count" radius={[6, 6, 0, 0]}>
                        {data.topics.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No failed quiz attempts recorded yet.
                </div>
              )}
            </div>

            {/* Topic Breakdown List */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base pb-3 border-b border-slate-100">
                  Member Struggle Breakdown
                </h3>
                <div className="divide-y divide-slate-100 mt-2">
                  {data?.topics && data.topics.length > 0 ? (
                    data.topics.map((t, idx) => (
                      <div key={idx} className="py-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 text-sm capitalize">
                              {t.topic.replace('-', ' ')}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                              {t.fail_count} {t.fail_count === 1 ? 'fail' : 'fails'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {t.members.map((m, mIdx) => (
                              <span
                                key={mIdx}
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200"
                              >
                                <Users className="w-2.5 h-2.5 text-slate-500" />
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 py-4">No breakdown available.</p>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Insight:</strong> <em>Directed cycle detection in graphs</em> is the #1 shared stumbling block. Aman, Priya, and Sneha all mixed up directed vs undirected cycle checks.
                </p>
              </div>
            </div>
          </div>

          {/* Hindsight Mental Model Insight Card */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">What the Group Struggles With</h2>
                  <p className="text-xs text-indigo-300">
                    Pre-computed Hindsight Mental Model: &ldquo;Group knowledge gaps&rdquo;
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/10 border border-white/20 text-indigo-200">
                Mental Model Active
              </span>
            </div>

            <div className="text-sm sm:text-base leading-relaxed text-slate-200 whitespace-pre-wrap font-sans">
              {data?.insight || 'No mental model insight available.'}
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-indigo-300 border-t border-white/10">
              <span>Source query: &ldquo;Which topics did several members fail or ask repeated doubts about, and who?&rdquo;</span>
              <span>&bull;</span>
              <span>Idempotent synthesis</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

