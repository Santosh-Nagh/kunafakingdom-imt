import { NextRequest, NextResponse } from 'next/server';

export const config = { runtime: 'edge' }; // Vercel Edge Function

export default async function handler(req: NextRequest) {
  if (req.method !== 'GET') {
    return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
  }

  const stores = [
    { id: 'branch1', name: 'Banjara Hills', address: '...', phone_number: '...', gstin: '...' },
    { id: 'branch2', name: 'Jubilee Hills', address: '...', phone_number: '...', gstin: '...' },
  ];

  return NextResponse.json(stores);
}
