import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'OK', service: 'CRM 360 Frontend', timestamp: new Date().toISOString() });
}
