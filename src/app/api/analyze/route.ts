import { NextRequest, NextResponse } from 'next/server';
import { extractText, isAcceptedType } from '@/lib/parsers';
import { analyzeRequirements } from '@/lib/gemini';
import { auth } from '@/auth';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const pastedText = formData.get('text') as string | null;

    let content = '';

    if (file && file.size > 0) {
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 });
      }
      if (!isAcceptedType(file.type)) {
        return NextResponse.json(
          { error: `Unsupported file type: ${file.type}` },
          { status: 400 }
        );
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      content = await extractText(buffer, file.type);
    } else if (pastedText?.trim()) {
      content = pastedText.trim();
    }

    if (!content) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    const result = await analyzeRequirements(content);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    console.error('[analyze]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
