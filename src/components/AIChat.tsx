'use client';

/**
 * AIChat — portable chat component.
 *
 * Drop into any Next.js project:
 *   1. Copy this file + ChatMessage type.
 *   2. Create a POST /api/chat route that accepts
 *      { message, history, systemContext } and returns { reply }.
 *   3. Render <AIChat systemContext="..." suggestions={[...]} />
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage } from '@/types/analysis';

export interface AIChatProps {
  /** Full system prompt / context injected into every request */
  systemContext: string;
  /** Clickable suggestion chips shown on empty state */
  suggestions?: string[];
  /** Textarea placeholder */
  placeholder?: string;
  /** API endpoint — defaults to /api/chat */
  apiEndpoint?: string;
  /** Empty-state heading */
  emptyTitle?: string;
  /** Empty-state subheading */
  emptySubtitle?: string;
}

export default function AIChat({
  systemContext,
  suggestions = [],
  placeholder = 'Ask a question… (Enter to send, Shift+Enter for new line)',
  apiEndpoint = '/api/chat',
  emptyTitle = 'Ask me anything',
  emptySubtitle = 'I have full context of this project.',
}: AIChatProps) {
  const [history, setHistory]     = useState<ChatMessage[]>([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [interimText, setInterimText] = useState('');

  const bottomRef     = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const baseInputRef  = useRef(''); // input value at the moment mic was started

  // Detect voice support client-side
  useEffect(() => {
    setVoiceSupported(!!(window.SpeechRecognition ?? window.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  // Clean up recognition on unmount
  useEffect(() => () => { recognitionRef.current?.stop(); }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    setInterimText('');
  }, []);

  function startListening() {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous    = false;
    recognition.interimResults = true;
    recognition.lang          = 'en-US';

    baseInputRef.current = input; // save whatever is already typed

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = '';
      let final   = '';
      for (let i = e.results.length - 1; i >= 0; i--) {
        if (e.results[i].isFinal) { final = e.results[i][0].transcript; break; }
        interim = e.results[i][0].transcript;
      }
      if (final) {
        setInput(baseInputRef.current + (baseInputRef.current ? ' ' : '') + final.trim());
        setInterimText('');
      } else {
        setInterimText(interim);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
      recognitionRef.current = null;
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error !== 'no-speech') setError(`Voice error: ${e.error}`);
      stopListening();
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
    setError(null);
  }

  function toggleVoice() {
    isListening ? stopListening() : startListening();
  }

  async function send(message: string) {
    if (!message.trim() || loading) return;
    stopListening();
    setInput('');
    setError(null);

    const userMsg: ChatMessage = { role: 'user', content: message };
    setHistory((h) => [...h, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history, systemContext }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Request failed');
      setHistory((h) => [...h, { role: 'assistant', content: data.reply! }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setHistory((h) => h.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  const displayInput = interimText ? input + (input ? ' ' : '') + interimText : input;

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] max-h-[800px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2">
        {history.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">💬</div>
            <p className="text-gray-700 font-semibold text-lg mb-1">{emptyTitle}</p>
            <p className="text-sm text-gray-400 mb-8">{emptySubtitle}</p>
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center max-w-xl mx-auto">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-sm px-4 py-2 rounded-full border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-brand-600 text-white rounded-br-sm'
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-4">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Listening banner */}
      {isListening && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl mb-2 text-sm text-red-600">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          Listening… speak now. Click the mic to stop.
          {interimText && <span className="text-gray-500 italic ml-2">"{interimText}"</span>}
        </div>
      )}

      {/* Input bar */}
      <div className={`flex gap-2 items-end rounded-xl border bg-white transition-all ${
        isListening ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-200'
      }`}>
        <textarea
          value={displayInput}
          onChange={(e) => { if (!isListening) setInput(e.target.value); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
          }}
          placeholder={isListening ? 'Listening for voice input…' : placeholder}
          rows={2}
          readOnly={isListening}
          className="flex-1 resize-none bg-transparent px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
        />

        {/* Voice button */}
        {voiceSupported && (
          <button
            onClick={toggleVoice}
            title={isListening ? 'Stop recording' : 'Start voice input'}
            className={`shrink-0 mb-2 mr-1 h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
              isListening
                ? 'bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            {isListening ? <MicOffIcon /> : <MicIcon />}
          </button>
        )}

        {/* Send button */}
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          title="Send message"
          className="shrink-0 mb-2 mr-2 h-10 w-10 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
        >
          <SendIcon />
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center mt-2">
        Enter to send · Shift+Enter for new line
        {voiceSupported && ' · 🎙 Click mic to use voice'}
      </p>
    </div>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0014 0M12 19v3M8 22h8" strokeLinecap="round" />
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0014 0M12 19v3M8 22h8M3 3l18 18" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 rotate-90">
      <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
