'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

export interface DiagramAccent {
  /** Light fill for primary nodes */
  primary: string;
  /** Node border / brand line color */
  border: string;
  /** Node label text color */
  text: string;
  /** Edge/line color */
  line: string;
  /** Soft tint used for secondary nodes & clusters */
  soft: string;
}

export const ACCENTS: Record<string, DiagramAccent> = {
  indigo:  { primary: '#eef2ff', border: '#6366f1', text: '#312e81', line: '#818cf8', soft: '#f5f3ff' },
  blue:    { primary: '#eff6ff', border: '#3b82f6', text: '#1e3a8a', line: '#60a5fa', soft: '#f0f9ff' },
  purple:  { primary: '#faf5ff', border: '#a855f7', text: '#581c87', line: '#c084fc', soft: '#fdf4ff' },
  emerald: { primary: '#ecfdf5', border: '#10b981', text: '#064e3b', line: '#34d399', soft: '#f0fdfa' },
  amber:   { primary: '#fffbeb', border: '#f59e0b', text: '#78350f', line: '#fbbf24', soft: '#fefce8' },
};

interface Props {
  chart: string;
  title?: string;
  /** Optional short caption shown under the title. */
  caption?: string;
  /** Optional icon/emoji shown next to the title. */
  icon?: string;
  /** Named accent palette (see ACCENTS) — defaults to brand indigo. */
  accent?: keyof typeof ACCENTS;
}

const MIN_SCALE = 0.3;
const MAX_SCALE = 5;

function buildMermaidConfig(accent: DiagramAccent) {
  return {
    startOnLoad: false,
    securityLevel: 'loose' as const,
    theme: 'base' as const,
    themeVariables: {
      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      fontSize: '15px',
      primaryColor: accent.primary,
      primaryBorderColor: accent.border,
      primaryTextColor: accent.text,
      lineColor: accent.line,
      secondaryColor: accent.soft,
      tertiaryColor: '#f8fafc',
      clusterBkg: accent.soft,
      clusterBorder: accent.border,
      edgeLabelBackground: '#ffffff',
      noteBkgColor: '#fef9c3',
      noteBorderColor: '#eab308',
      actorBkg: accent.primary,
      actorBorder: accent.border,
      actorTextColor: accent.text,
      signalColor: accent.line,
      signalTextColor: '#334155',

      // Gantt (sprint timeline)
      sectionBkgColor: accent.soft,
      sectionBkgColor2: '#ffffff',
      altSectionBkgColor: '#ffffff',
      gridColor: '#e2e8f0',
      taskBkgColor: accent.primary,
      taskBorderColor: accent.border,
      taskTextColor: accent.text,
      taskTextOutsideColor: '#334155',
      taskTextLightColor: accent.text,
      activeTaskBkgColor: accent.border,
      activeTaskBorderColor: accent.text,
      doneTaskBkgColor: '#d1fae5',
      doneTaskBorderColor: '#10b981',
      critBkgColor: '#fecaca',
      critBorderColor: '#dc2626',
      todayLineColor: '#dc2626',
    },
    flowchart: { curve: 'basis' as const, padding: 16, nodeSpacing: 45, rankSpacing: 60, useMaxWidth: false, htmlLabels: true },
    sequence: { actorMargin: 70, boxMargin: 12, messageMargin: 42, mirrorActors: false, useMaxWidth: false },
    er: { fontSize: 14, useMaxWidth: false },
    state: { useMaxWidth: false },
    gantt: {
      barHeight: 28,
      barGap: 8,
      topPadding: 55,
      leftPadding: 110,
      gridLineStartPadding: 30,
      fontSize: 13,
      sectionFontSize: 13,
      numberSectionStyles: 4,
      axisFormat: '%b %d',
      useMaxWidth: false,
    },
  };
}

export default function MermaidDiagram({ chart, title, caption, icon, accent = 'indigo' }: Props) {
  const id = useId().replace(/:/g, '');
  const palette = ACCENTS[accent] ?? ACCENTS.indigo;
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // pan/zoom transform
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  const reset = useCallback(() => { setScale(1); setTx(0); setTy(0); }, []);

  useEffect(() => {
    if (!chart.trim()) return;
    let cancelled = false;

    import('mermaid').then(async (mod) => {
      if (cancelled) return;
      const mermaid = mod.default;
      mermaid.initialize(buildMermaidConfig(palette));
      try {
        const { svg: rendered } = await mermaid.render(`mermaid-${id}`, chart.trim());
        if (!cancelled) { setSvg(rendered); setError(null); reset(); }
      } catch {
        if (!cancelled) setError('Could not render diagram');
      }
    });

    return () => { cancelled = true; };
  }, [chart, id, reset, palette]);

  // Lock body scroll while the fullscreen overlay is open.
  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [fullscreen]);

  function zoomAt(clientX: number, clientY: number, factor: number, rect: DOMRect) {
    setScale((s) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s * factor));
      const ratio = next / s;
      const cx = clientX - rect.left;
      const cy = clientY - rect.top;
      setTx((x) => cx - (cx - x) * ratio);
      setTy((y) => cy - (cy - y) * ratio);
      return next;
    });
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 1 / 1.12, rect);
  }

  function handleMouseDown(e: React.MouseEvent) {
    drag.current = { x: e.clientX, y: e.clientY, tx, ty };
  }
  function handleMouseMove(e: React.MouseEvent) {
    if (!drag.current) return;
    setTx(drag.current.tx + (e.clientX - drag.current.x));
    setTy(drag.current.ty + (e.clientY - drag.current.y));
  }
  function endDrag() { drag.current = null; }

  const fileBase = (title ?? 'diagram').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  function downloadSvg() {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    triggerDownload(URL.createObjectURL(blob), `${fileBase}.svg`, true);
  }

  function downloadPng() {
    const img = new Image();
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const scaleUp = 2; // retina-quality export
      const canvas = document.createElement('canvas');
      canvas.width = (img.width || 800) * scaleUp;
      canvas.height = (img.height || 600) * scaleUp;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) triggerDownload(URL.createObjectURL(blob), `${fileBase}.png`, true);
        }, 'image/png');
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  function triggerDownload(href: string, name: string, revoke: boolean) {
    const a = document.createElement('a');
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (revoke) setTimeout(() => URL.revokeObjectURL(href), 1000);
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-600 mb-2">{error}</p>
        <pre className="text-xs text-gray-500 whitespace-pre-wrap">{chart}</pre>
      </div>
    );
  }

  const viewport = (big: boolean) => (
    <div
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      className={`relative overflow-hidden bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] ${
        big ? 'flex-1' : 'h-[480px]'
      } ${drag.current ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      <div
        className="absolute left-0 top-0 origin-top-left will-change-transform p-6"
        style={{ transform: `translate(${tx}px, ${ty}px) scale(${scale})` }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <span className="pointer-events-none absolute bottom-2 right-3 text-[11px] font-medium text-gray-400">
        {Math.round(scale * 100)}%
      </span>
    </div>
  );

  const toolbar = (
    <div className="flex items-center gap-1">
      <ToolBtn label="Zoom out" onClick={() => setScale((s) => Math.max(MIN_SCALE, s / 1.2))}>−</ToolBtn>
      <ToolBtn label="Zoom in" onClick={() => setScale((s) => Math.min(MAX_SCALE, s * 1.2))}>+</ToolBtn>
      <ToolBtn label="Reset view" onClick={reset}>⤾</ToolBtn>
      <span className="mx-1 h-4 w-px bg-gray-200" />
      <ToolBtn label="Download PNG" onClick={downloadPng}>PNG</ToolBtn>
      <ToolBtn label="Download SVG" onClick={downloadSvg}>SVG</ToolBtn>
      <span className="mx-1 h-4 w-px bg-gray-200" />
      <ToolBtn label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} onClick={() => setFullscreen((v) => !v)}>
        {fullscreen ? '✕' : '⤢'}
      </ToolBtn>
    </div>
  );

  const header = (fullscreenMode: boolean) => (
    <div
      className={`flex items-center justify-between gap-3 border-b border-gray-100 ${
        fullscreenMode ? 'px-5 py-3' : 'px-4 py-3'
      }`}
    >
      <div className="min-w-0 flex items-center gap-2.5">
        {icon && (
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base"
            style={{ backgroundColor: palette.primary, color: palette.text }}
          >
            {icon}
          </span>
        )}
        <div className="min-w-0">
          {title && <h3 className="text-sm font-semibold text-gray-800 truncate">{title}</h3>}
          {caption && <p className="text-xs text-gray-400 truncate">{caption}</p>}
        </div>
      </div>
      {toolbar}
    </div>
  );

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="h-1" style={{ backgroundColor: palette.border }} />
        {header(false)}
        {viewport(false)}
      </div>

      {fullscreen && (
        <div className="no-print fixed inset-0 z-50 flex flex-col bg-white">
          <div className="h-1 shrink-0" style={{ backgroundColor: palette.border }} />
          {header(true)}
          {viewport(true)}
        </div>
      )}
    </>
  );
}

function ToolBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-xs font-semibold text-gray-500 hover:bg-brand-50 hover:text-brand-600 transition-colors"
    >
      {children}
    </button>
  );
}
