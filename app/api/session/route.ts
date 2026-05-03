import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verifyAuth';
import { adminDb } from '@/lib/firebase/admin';
import { SessionRecord } from '@/lib/types/game';

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body: SessionRecord = await req.json();
  if (body.userId !== auth.uid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await adminDb
    .collection('users')
    .doc(auth.uid)
    .collection('sessions')
    .doc(body.sessionId)
    .set(body);

  return NextResponse.json({ ok: true });
}
