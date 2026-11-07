import './globals.css';
import Navbar from '../components/Navbar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RecallRoom - Community Knowledge Memory',
  description: "Your group's memory, so nobody solves the same doubt twice",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white/50 py-6 mt-12 text-center text-xs text-slate-500">
          <p>
            RecallRoom &bull; Powered by <strong className="text-slate-700">Hindsight Memory</strong> &amp; <strong className="text-slate-700">Groq LLM</strong>
          </p>
          <p className="mt-1 text-slate-400">
            Synthetic study group scenario (Rahul, Priya, Aman, Sneha) for DSA prep
          </p>
        </footer>
      </body>
    </html>
  );
}

