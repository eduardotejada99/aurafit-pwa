import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { calculateWeightAnalytics } from '@/lib/fitness-data';

const SAMPLE_WEIGHT_HISTORY = [
  { log_date: '2026-10-10', weight_kg: 72.1 },
  { log_date: '2026-10-11', weight_kg: 72.3 },
  { log_date: '2026-10-12', weight_kg: 72.2 },
  { log_date: '2026-10-13', weight_kg: 72.4 },
  { log_date: '2026-10-14', weight_kg: 72.6 },
  { log_date: '2026-10-15', weight_kg: 72.5 },
  { log_date: '2026-10-16', weight_kg: 72.7 },
  { log_date: '2026-10-17', weight_kg: 72.8 }
];

export async function GET() {
  try {
    const res = await query('SELECT log_date, weight_kg FROM weight_logs ORDER BY log_date ASC LIMIT 30');
    if (!res.isFallback && res.rows.length > 0) {
      const analytics = calculateWeightAnalytics(res.rows);
      return NextResponse.json({ success: true, history: res.rows, analytics });
    }
  } catch (err) {
    console.warn('API weight error, using sample history:', err.message);
  }

  const analytics = calculateWeightAnalytics(SAMPLE_WEIGHT_HISTORY);
  return NextResponse.json({ success: true, history: SAMPLE_WEIGHT_HISTORY, analytics });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { weightKg, notes } = body;

    await query(
      `INSERT INTO weight_logs (log_date, weight_kg, notes)
       VALUES (CURRENT_DATE, $1, $2)
       ON CONFLICT (log_date) DO UPDATE SET weight_kg = $1, notes = $2`,
      [weightKg, notes || '']
    );

    return NextResponse.json({ success: true, weightKg, saved: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
