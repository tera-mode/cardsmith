import { adminAuth } from '@/lib/firebase/admin';
import { NextRequest } from 'next/server';

export async function verifyAuth(req: NextRequest): Promise<{ uid: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}
