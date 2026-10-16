import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    return NextResponse.json({ status: 'ok', db: rows });
  } catch (error: any) {
    console.error('DB health check failed:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}