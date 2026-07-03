import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { ChatMessage } from '@/types/analysis';
import { MODEL } from '@/lib/gemini';
import { auth } from '@/auth';

function getClient() {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY is not set');
  return new OpenAI({ apiKey: key, baseURL: 'https://api.groq.com/openai/v1' });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { message, history, systemContext } = (await req.json()) as {
      message: string;
      history: ChatMessage[];
      systemContext: string;
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const client = getClient();

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemContext },
      ...history.map((m) => ({ role: m.role, content: m.content } as OpenAI.Chat.ChatCompletionMessageParam)),
      { role: 'user', content: message },
    ];

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.5,
      max_tokens: 1024,
    });

    const reply = completion.choices[0]?.message?.content ?? 'No response generated.';
    return NextResponse.json({ reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Chat failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
