'use client';

import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';

interface Props {
  onSubmit: (formData: FormData) => void;
  loading: boolean;
  defaultText?: string;
}

export default function FileUpload({ onSubmit, loading, defaultText = '' }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState(defaultText);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    setFile(f);
    setText('');
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  function handleSubmit() {
    if (!file && !text.trim()) return;
    const fd = new FormData();
    if (file) fd.append('file', file);
    else fd.append('text', text);
    onSubmit(fd);
  }

  const canSubmit = (file !== null || text.trim().length > 0) && !loading;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
          ${dragging ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-gray-400 bg-white'}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={handleChange}
        />

        {file ? (
          <div className="space-y-1">
            <div className="text-3xl">📄</div>
            <p className="font-medium text-gray-800">{file.name}</p>
            <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="text-xs text-red-500 hover:underline mt-1"
            >
              Remove
            </button>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-3">☁️</div>
            <p className="font-medium text-gray-700">Drop your file here or click to browse</p>
            <p className="text-sm text-gray-400 mt-1">PDF, DOCX, or TXT &bull; Max 10 MB</p>
          </>
        )}
      </div>

      {/* Divider */}
      {!file && (
        <>
          <div className="flex items-center gap-3 text-gray-400 text-sm">
            <div className="flex-1 h-px bg-gray-200" />
            or paste text
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your requirements, meeting notes, or email content here..."
            rows={6}
            className="w-full rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full py-3.5 rounded-xl font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Analyzing...
          </>
        ) : (
          'Analyze Requirements'
        )}
      </button>
    </div>
  );
}
