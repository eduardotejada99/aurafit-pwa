import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const ALLOWED_LOG_FIELDS = [
  'logDate',
  'creatineDone',
  'mindvalleyDone',
  'mindvalleyLesson',
  'waterMl',
  'sleepHours',
  'sleepQuality',
  'workoutMode',
  'workoutCompleted'
];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get('profileId') || 'andres';
  const sql = await getDb();
  if (!sql) {
    return NextResponse.json({
      ok: true,
      mode: 'localStorage',
      message: 'DATABASE_URL no configurada. Operando 100% en modo Offline/LocalStorage.'
    });
  }

  try {
    const rows = await sql`
      SELECT profile_id, log_date, creatine_done, mindvalley_done, mindvalley_lesson,
             water_ml, sleep_hours, sleep_quality, body_weight_kg,
             workout_mode, workout_completed
      FROM aurafit_daily_logs
      WHERE profile_id = ${profileId}
      ORDER BY log_date DESC
      LIMIT 14
    `;
    return NextResponse.json({ ok: true, mode: 'neon-postgres', profileId, logs: rows });
  } catch (error) {
    return NextResponse.json({
      ok: true,
      mode: 'localStorage',
      profileId,
      warning: 'Tabla aún no inicializada o sin red; usando fallback local.'
    });
  }
}

export async function POST(request) {
  const sql = await getDb();
  if (!sql) {
    return NextResponse.json({
      ok: true,
      mode: 'localStorage',
      synced: false
    });
  }

  try {
    const body = await request.json();
    const rawLog = body?.dayLog || {};
    const profile = body?.profile || {};
    const profileId = String(body?.profileId || profile?.id || 'andres').toLowerCase().slice(0, 30);

    const clean = {};
    for (const key of ALLOWED_LOG_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(rawLog, key)) {
        clean[key] = rawLog[key];
      }
    }

    const logDate = String(clean.logDate || new Date().toISOString().split('T')[0]).slice(0, 10);
    const creatineDone = Boolean(clean.creatineDone);
    const mindvalleyDone = Boolean(clean.mindvalleyDone);
    const mindvalleyLesson = String(clean.mindvalleyLesson || '').slice(0, 500);
    const waterMl = Math.max(0, Math.min(10000, Number(clean.waterMl) || 0));
    const sleepHours = Math.max(0, Math.min(24, Number(clean.sleepHours) || 7.5));
    const sleepQuality = String(clean.sleepQuality || 'Optimo').slice(0, 20);
    const bodyWeightKg = Math.max(30, Math.min(250, Number(profile.weightKg) || 74.5));
    const workoutMode = String(clean.workoutMode || 'gym').slice(0, 15);
    const workoutCompleted = Boolean(clean.workoutCompleted);

    await sql`
      CREATE TABLE IF NOT EXISTS aurafit_daily_logs (
        profile_id VARCHAR(30) NOT NULL DEFAULT 'andres',
        log_date DATE NOT NULL,
        creatine_done BOOLEAN NOT NULL DEFAULT FALSE,
        mindvalley_done BOOLEAN NOT NULL DEFAULT FALSE,
        mindvalley_lesson VARCHAR(500) DEFAULT '',
        water_ml INTEGER NOT NULL DEFAULT 0,
        sleep_hours NUMERIC(3,1) NOT NULL DEFAULT 7.5,
        sleep_quality VARCHAR(20) NOT NULL DEFAULT 'Optimo',
        body_weight_kg NUMERIC(5,2),
        workout_mode VARCHAR(15) DEFAULT 'gym',
        workout_completed BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (profile_id, log_date)
      )
    `;

    // Ensure profile_id column exists if table was created in older schema
    try {
      await sql`ALTER TABLE aurafit_daily_logs ADD COLUMN IF NOT EXISTS profile_id VARCHAR(30) DEFAULT 'andres'`;
    } catch (e) {
      // ignore
    }

    await sql`
      INSERT INTO aurafit_daily_logs (
        profile_id, log_date, creatine_done, mindvalley_done, mindvalley_lesson,
        water_ml, sleep_hours, sleep_quality, body_weight_kg,
        workout_mode, workout_completed, updated_at
      ) VALUES (
        ${profileId}, ${logDate}, ${creatineDone}, ${mindvalleyDone}, ${mindvalleyLesson},
        ${waterMl}, ${sleepHours}, ${sleepQuality}, ${bodyWeightKg},
        ${workoutMode}, ${workoutCompleted}, NOW()
      )
      ON CONFLICT (profile_id, log_date) DO UPDATE SET
        creatine_done = EXCLUDED.creatine_done,
        mindvalley_done = EXCLUDED.mindvalley_done,
        mindvalley_lesson = EXCLUDED.mindvalley_lesson,
        water_ml = EXCLUDED.water_ml,
        sleep_hours = EXCLUDED.sleep_hours,
        sleep_quality = EXCLUDED.sleep_quality,
        body_weight_kg = EXCLUDED.body_weight_kg,
        workout_mode = EXCLUDED.workout_mode,
        workout_completed = EXCLUDED.workout_completed,
        updated_at = NOW()
    `;

    return NextResponse.json({
      ok: true,
      mode: 'neon-postgres',
      profileId,
      synced: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      ok: true,
      mode: 'localStorage',
      synced: false,
      error: error.message
    });
  }
}
