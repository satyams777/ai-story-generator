import mammoth from 'mammoth';
import { execFileSync } from 'child_process';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
];

export function isAcceptedType(mimeType: string): boolean {
  return ACCEPTED_TYPES.includes(mimeType);
}

export async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    return extractPdfText(buffer);
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  return buffer.toString('utf-8').trim();
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  // Try pdf-parse first (fast, no subprocess)
  try {
    const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
    const data = await pdfParse(buffer);
    if (data.text?.trim()) return data.text.trim();
  } catch {
    // fall through to pdftotext
  }

  // Fallback: pdftotext (poppler) — handles non-standard XRef, scanned, linearized PDFs
  try {
    const text = execFileSync('pdftotext', ['-', '-'], {
      input: buffer,
      maxBuffer: 50 * 1024 * 1024,
    }).toString('utf-8').trim();

    if (text) return text;
    throw new Error('PDF appears to be image-only (no extractable text)');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('image-only')) throw new Error(msg);
    throw new Error('Could not extract text from this PDF. If it is a scanned document, please paste the text manually.');
  }
}
