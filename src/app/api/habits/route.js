import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { DEFAULT_HABITS } from '@/lib/fitness-data';

export async function GET() {
  try {
    const res = await query('SELECT * FROM habit_logs WHERE log_date = CURRENT_DATE LIMIT 1');
    if (!res.isFallback && res.rows.length > 0) {
      return NextResponse.json({ success: true, habits: res.rows[0], source: 'database' });
    }
  } catch (err) {
    console.warn('API habits error, using defaults:', err.message);
  }
  return NextResponse.json({ success: true, habits: DEFAULT_HABITS, source: 'fallback' });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { habitId, completed, notes } = body;

    // Database upsert if available
    await query(
      `INSERT INTO habit_logs (log_date, creatine_taken, notes)
       VALUES (CURRENT_DATE, $1, $2)
       ON CONFLICT (log_date) DO UPDATE SET creatine_taken = $1, notes = $2`,
      [completed, notes || '']
    );

    return NextResponse.json({ success: true, habitId, completed, updated: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
