'use client';

import React from 'react';
import { Database, User, Calendar, Tag, Sparkles, AlertCircle } from 'lucide-react';

export interface MemoryItem {
  text: string;
  date?: string;
  author?: string;
  tags?: string[];
  topic?: string;
}

interface MemoryPanelProps {
  memories: MemoryItem[];
  highlight?: boolean;
  isLoading?: boolean;
  title?: string;
}

export default function MemoryPanel({
  memories,
  highlight = false,
  isLoading = false,
  title = "Recalled Group Memories",
}: MemoryPanelProps) {
  const getAuthorColor = (author?: string) => {
    switch (author?.toLowerCase()) {
      case 'rahul':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'priya':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'aman':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'sneha':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-500 bg-white shadow-sm flex flex-col h-full ${
        highlight
          ? 'border-indigo-400 ring-2 ring-indigo-300/50 shadow-indigo-100'
          : 'border-slate-200'
      }`}
    >
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              {title}
              {highlight && (
                <span className="flex items-center gap-1 text-[11px] text-indigo-700 font-medium bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 animate-pulse">
                  <Sparkles className="w-3 h-3" /> Active Context
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">Hindsight Memory Bank: group-dsa</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          {memories.length} {memories.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-3 max-h-[600px]">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/5"></div>
                </div>
                <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : memories.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">No memories recalled yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">
              Ask a question with Memory ON to recall peer explanations, doubts, and quiz records from Hindsight.
            </p>
          </div>
        ) : (
          memories.map((mem, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border transition-all text-sm group ${
                highlight
                  ? 'border-indigo-200 bg-indigo-50/20 hover:border-indigo-300'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border ${getAuthorColor(
                    mem.author
                  )}`}
                >
                  <User className="w-3 h-3" />
                  {mem.author || 'Group Member'}
                </span>

                {mem.date && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {mem.date}
                  </span>
                )}
              </div>

              <p className="text-slate-700 leading-relaxed text-[13px]">{mem.text}</p>

              {(mem.tags && mem.tags.length > 0) && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {mem.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/70"
                    >
                      <Tag className="w-2.5 h-2.5 text-slate-400" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="p-3 bg-slate-50 border-t border-slate-100 rounded-b-2xl text-[11px] text-slate-500 flex items-center justify-between">
        <span>Verified by Hindsight Semantic Recall</span>
        <span className="font-mono text-indigo-600">include_source_facts=True</span>
      </div>
    </div>
  );
}

