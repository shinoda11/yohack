import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, judgment, prepBucket, fitgateAnswers } = await req.json();

    // TODO Phase2: Supabase prepModeSubscribers テーブルに保存
    // TODO Phase2: SendGrid でレター送信
    console.log(
      '[Prep登録]',
      email,
      `judgment=${judgment}`,
      prepBucket ? `bucket=${prepBucket}` : '',
      JSON.stringify(fitgateAnswers),
      new Date().toISOString()
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}
