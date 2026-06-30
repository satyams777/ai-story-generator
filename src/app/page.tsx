'use client';

import { useState } from 'react';
import type { AnalysisResult } from '@/types/analysis';
import FileUpload from '@/components/FileUpload';
import Dashboard from '@/components/Dashboard';

type Status = 'idle' | 'loading' | 'done' | 'error';

export default function Home() {
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setStatus('loading');
    setError(null);

    try {
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      const data = (await res.json()) as AnalysisResult & { error?: string };

      if (!res.ok) throw new Error(data.error ?? 'Analysis failed');

      setResult(data);
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  }

  function handleReset() {
    setStatus('idle');
    setResult(null);
    setError(null);
  }

  if (status === 'done' && result) {
    return <Dashboard result={result} onReset={handleReset} />;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">AI Business Analyst</h1>
          <p className="text-gray-500 text-lg">
            Upload a requirements document and get a complete project plan in under 2 minutes.
          </p>
        </div>

        {status === 'error' && error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        <FileUpload onSubmit={handleSubmit} loading={status === 'loading'} />

        <p className="mt-6 text-center text-xs text-gray-400">
          Accepts PDF, DOCX, or plain text &bull; Powered by Llama 3.3 via Groq
        </p>
      </div>
    </main>
  );
}
