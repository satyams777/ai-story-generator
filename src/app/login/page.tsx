'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get('registered') === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);

    if (res?.error) {
      setError('Incorrect email or password');
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen lg:flex bg-gray-50">
      {/* Brand panel */}
      <div className="relative hidden lg:flex lg:w-[44%] flex-col justify-between overflow-hidden bg-gray-950 px-12 py-12 text-white">
        <div className="absolute inset-0 bg-grid-fade opacity-40" />
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand-600/40 blur-3xl animate-blob" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-fuchsia-600/20 blur-3xl animate-blob" style={{ animationDelay: '4s' }} />

        <div className="relative flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          <span className="text-sm font-semibold tracking-wide">AI Business Analyst</span>
        </div>

        <div className="relative">
          <h2 className="text-3xl font-bold leading-tight mb-4">
            Requirements in.<br />Full project plan out.
          </h2>
          <ul className="space-y-3 text-sm text-white/70">
            {[
              'Executive summaries, user stories & Jira-ready tickets',
              'Effort estimates and sprint planning in seconds',
              'Role-based views for PMs, developers & stakeholders',
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

          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1 mb-8">Sign in to pick up where you left off</p>

          {justRegistered && (
            <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-green-700 text-sm text-center">
              Account created — sign in below.
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-100 rounded-2xl p-6 shadow-card">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">✉️</span>
                <input
                  type="email"
                  required
                  autoFocus
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-all shadow-glow hover:shadow-none"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-brand-600 font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
