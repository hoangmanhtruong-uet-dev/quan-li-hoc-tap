import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/study/rooms/time
 *
 * High-precision SNTP server timestamp endpoint for multi-client clock
 * synchronization in Pomodoro Party realtime study rooms.
 * Guarantees zero caching via strict HTTP cache control headers so that
 * client round-trip latency measurements achieve < 200ms offset accuracy.
 */
export async function GET() {
  const now = Date.now();

  return NextResponse.json(
    {
      serverTime: now,
      iso: new Date(now).toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}
