'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Registration failed');

      router.push('/login?registered=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen lg:flex bg-gray-50">
      {/* Brand panel */}
      <div className="relative hidden lg:flex lg:w-[44%] flex-col justify-between overflow-hidden bg-gray-950 px-12 py-12 text-white">
        <div className="absolute inset-0 bg-grid-fade opacity-40" />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-600/40 blur-3xl animate-blob" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-fuchsia-600/20 blur-3xl animate-blob" style={{ animationDelay: '4s' }} />

        <div className="relative flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          <span className="text-sm font-semibold tracking-wide">AI Business Analyst</span>
        </div>

        <div className="relative">
          <h2 className="text-3xl font-bold leading-tight mb-4">
            Your first plan is<br />two minutes away.
          </h2>
          <ul className="space-y-3 text-sm text-white/70">
            {[
              'Upload a PDF, DOCX, or paste plain text',
              'Get diagrams, estimates & tickets instantly',
              'Invite your team with role-based access',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-brand-300">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">Powered entirely by free tools · Built for fast-moving teams</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-full px-4 py-1.5 text-sm font-medium text-brand-600 mb-4">
              <span>🧠</span> AI Business Analyst
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1 mb-8">Save and revisit your project plans</p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-100 rounded-2xl p-6 shadow-card">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Name</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🙂</span>
                <input
                  type="text"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">✉️</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">At least 8 characters</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-all shadow-glow hover:shadow-none"
            >
              {loading ? 'Creating account…' : 'Sign up'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
