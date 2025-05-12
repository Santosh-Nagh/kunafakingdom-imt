import { NextRequest, NextResponse } from 'next/server';

export const config = { runtime: 'edge' };

export default async function handler(req: NextRequest) {
  if (req.method !== 'GET') {
    return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
  }

  const charges = []; // Fill with sample or real data

  return NextResponse.json(charges);
}
