import Link from 'next/link';
import { ArrowRight, BookOpen, GitCompare, Sparkles, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export default function LandingPage() {
  const steps = [
    {
      num: '01',
      title: 'Discuss & Retain',
      desc: 'Peers log discussions, doubts, and quiz attempts. Hindsight extracts key concepts, tags metadata, and anchors them to timestamps.',
      icon: BookOpen,
      accent: 'from-blue-500 to-indigo-600',
    },
    {
      num: '02',
      title: 'Recall with Attribution',
      desc: 'When anyone asks a question, RecallRoom retrieves the exact peer explanations and failure patterns, never hallucinating answers.',
      icon: Zap,
      accent: 'from-indigo-600 to-violet-600',
    },
    {
      num: '03',
      title: 'Map Gaps & Practice',
      desc: 'Hindsight mental models synthesize collective weak spots across quizzes, generating targeted practice before the exam.',
      icon: GitCompare,
      accent: 'from-violet-600 to-purple-600',
    },
  ];

  return (
    <div className="space-y-16 py-6 sm:py-12">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-semibold text-indigo-700 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Built with Hindsight Memory + Groq</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
          Your group&apos;s memory, so{' '}
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            nobody solves the same doubt twice
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
          RecallRoom remembers peer explanations, past doubts, and quiz mistakes for your study group.
          See the dramatic difference between a generic AI answer and memory-backed collective intelligence.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/ask"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all text-base"
          >
            <span>Try the Demo</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/gaps"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-slate-700 font-semibold border border-slate-200 shadow-sm hover:bg-slate-50 transition-all text-base"
          >
            <span>Explore Gap Map</span>
          </Link>
        </div>
      </div>

      {/* Demo Scenario Callout */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="text-xs uppercase tracking-wider font-bold text-indigo-400">Live Demo Scenario</span>
          <h2 className="text-2xl sm:text-3xl font-bold">4-Person DSA Exam-Prep Group</h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Meet <strong>Rahul, Priya, Aman, and Sneha</strong>. They spent two months preparing for their Data Structures &amp; Algorithms midterm.
            RecallRoom remembers Rahul&apos;s shortcut table metaphor for Dynamic Programming, Priya&apos;s Dijkstra warning, and how Aman, Priya, and Sneha all failed directed cycle detection.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[
              { name: 'Rahul', role: 'Shortcut & Heaps Guru' },
              { name: 'Priya', role: 'Hashing & Shortest Paths' },
              { name: 'Aman', role: 'Knapsack & Graph Doubts' },
              { name: 'Sneha', role: 'Demo Student (Midterm Ready)' },
            ].map((m, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <p className="font-semibold text-white text-sm">{m.name}</p>
                <p className="text-xs text-indigo-300">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3 Steps */}
      <div className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">How RecallRoom Works</h2>
          <p className="text-slate-600 text-sm">Three core steps powered by Hindsight community memory bank</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${s.accent} flex items-center justify-center text-white shadow-md`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black text-slate-200 font-mono">{s.num}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Guarantee & Star Feature */}
      <div className="bg-indigo-50/60 rounded-2xl p-6 sm:p-8 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-base">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span>Attribution Guarantee: Never Fabricated</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
            When memory is active, every explanation quotes real peers with dates and tags. If no peer discussed it, the agent says &ldquo;I don&apos;t have anything on that yet.&rdquo;
          </p>
        </div>
        <Link
          href="/ask"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 whitespace-nowrap shadow-sm shadow-indigo-200"
        >
          <span>Ask a Question</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

