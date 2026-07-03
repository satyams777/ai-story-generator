'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { AnalysisResult } from '@/types/analysis';
import Dashboard from '@/components/Dashboard';

type Status = 'loading' | 'done' | 'error';

export default function SharedProjectPage() {
  const params = useParams<{ token: string }>();
  const [status, setStatus] = useState<Status>('loading');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [hoursPerPoint, setHoursPerPoint] = useState(4);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/share/${params.token}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Could not load this project');
        if (cancelled) return;
        setResult(data.result);
        setHoursPerPoint(data.hoursPerPoint ?? 4);
        setStatus('done');
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Could not load this project');
        setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [params.token]);

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">Loading shared project…</div>;
  }

  if (status === 'error' || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-3xl mb-3">🔒</p>
          <p className="text-sm font-medium text-gray-700">{error ?? 'This link is invalid or has been revoked.'}</p>
        </div>
      </div>
    );
  }

  return (
    <Dashboard
      result={result}
      onReset={() => {}}
      onResultUpdate={() => {}}
      projectId={null}
      initialHoursPerPoint={hoursPerPoint}
      initialRole="stakeholder"
      publicView
    />
  );
}
