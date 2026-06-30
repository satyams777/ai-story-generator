declare module 'pdf-parse/lib/pdf-parse.js' {
  function pdfParse(
    dataBuffer: Buffer | Uint8Array,
    options?: object
  ): Promise<{ text: string; numpages: number; info: object; metadata: object }>;
  export default pdfParse;
}

// Web Speech API (not in all TS DOM lib versions)
interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
}
interface Window {
  SpeechRecognition?: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
}
