'use client';

import { useEffect, useId, useRef, useState } from 'react';

interface Props {
  chart: string;
  title?: string;
}

export default function MermaidDiagram({ chart, title }: Props) {
  const id = useId().replace(/:/g, '');
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current || !chart.trim()) return;

    let cancelled = false;

    import('mermaid').then(async (mod) => {
      if (cancelled) return;
      const mermaid = mod.default;
      mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose' });

      try {
        const { svg } = await mermaid.render(`mermaid-${id}`, chart.trim());
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError('Could not render diagram');
        }
      }
    });

    return () => { cancelled = true; };
  }, [chart, id]);

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-600 mb-2">{error}</p>
        <pre className="text-xs text-gray-500 whitespace-pre-wrap">{chart}</pre>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      {title && <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">{title}</h3>}
      <div ref={ref} className="overflow-x-auto flex justify-center" />
    </div>
  );
}
