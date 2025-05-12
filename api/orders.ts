import { NextRequest, NextResponse } from 'next/server';

export const config = { runtime: 'edge' };

export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
  }

  const body = await req.json();
  console.log("Received Order:", body);

  // Simulate order response
  const response = {
    id: 'order_1234567890',
    store: body.store,
    items: body.items,
    applied_charges: body.applied_charges,
    ...body,
    created_at: new Date().toISOString(),
  };

  return NextResponse.json(response);
}
