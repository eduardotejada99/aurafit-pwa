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

async function ensureSyncTable(sql) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS aurafit_cloud_sync (
        sync_key VARCHAR(100) PRIMARY KEY,
        sync_data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_by VARCHAR(50) DEFAULT 'device'
      )
    `;
  } catch (err) {
    console.warn('[Sync] ensureSyncTable warning:', err.message);
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get('profileId') || 'andres';
  const requestedKey = searchParams.get('key');
  const sql = await getDb();

  if (!sql) {
    return NextResponse.json({
      ok: true,
      mode: 'localStorage',
      message: 'DATABASE_URL no configurada. Operando 100% en modo Offline/LocalStorage.',
      items: {},
      logs: []
    });
  }

  try {
    await ensureSyncTable(sql);

    let items = {};
    let timestamps = {};

    if (requestedKey) {
      const rows = await sql`
        SELECT sync_key, sync_data, updated_at, updated_by
        FROM aurafit_cloud_sync
        WHERE sync_key = ${requestedKey}
      `;
      if (rows && rows.length > 0) {
        items[rows[0].sync_key] = rows[0].sync_data;
        timestamps[rows[0].sync_key] = rows[0].updated_at;
      }
    } else {
      const rows = await sql`
        SELECT sync_key, sync_data, updated_at, updated_by
        FROM aurafit_cloud_sync
      `;
      if (rows && Array.isArray(rows)) {
        rows.forEach((r) => {
          items[r.sync_key] = r.sync_data;
          timestamps[r.sync_key] = r.updated_at;
        });
      }
    }

    // Optional legacy daily logs query
    let dailyLogs = [];
    try {
      dailyLogs = await sql`
        SELECT profile_id, log_date, creatine_done, mindvalley_done, mindvalley_lesson,
               water_ml, sleep_hours, sleep_quality, body_weight_kg,
               workout_mode, workout_completed
        FROM aurafit_daily_logs
        WHERE profile_id = ${profileId}
        ORDER BY log_date DESC
        LIMIT 14
      `;
    } catch (e) {
      // Table may not exist yet or empty
    }

    return NextResponse.json({
      ok: true,
      mode: 'neon-postgres',
      profileId,
      items,
      timestamps,
      logs: dailyLogs
    });
  } catch (error) {
    console.error('[Sync GET error]:', error);
    return NextResponse.json({
      ok: true,
      mode: 'localStorage',
      profileId,
      items: {},
      warning: error.message
    });
  }
}

export async function POST(request) {
  const sql = await getDb();
  if (!sql) {
    return NextResponse.json({
      ok: true,
      mode: 'localStorage',
      synced: false,
      message: 'DATABASE_URL no configurada. Guardado en dispositivo.'
    });
  }

  try {
    await ensureSyncTable(sql);
    const body = await request.json();
    const updatedBy = String(body?.updatedBy || body?.profileId || 'mobile-device').slice(0, 50);

    // 1. Process Multi-Device Sync Bundle or single key
    let syncedCount = 0;
    if (body.bundle && typeof body.bundle === 'object') {
      for (const [key, value] of Object.entries(body.bundle)) {
        if (!key || typeof key !== 'string') continue;
        const cleanKey = key.slice(0, 100);
        await sql`
          INSERT INTO aurafit_cloud_sync (sync_key, sync_data, updated_at, updated_by)
          VALUES (${cleanKey}, ${JSON.stringify(value)}, NOW(), ${updatedBy})
          ON CONFLICT (sync_key) DO UPDATE SET
            sync_data = EXCLUDED.sync_data,
            updated_at = NOW(),
            updated_by = EXCLUDED.updated_by
        `;
        syncedCount++;
      }
    }

    if (body.key && body.data !== undefined) {
      const cleanKey = String(body.key).slice(0, 100);
      await sql`
        INSERT INTO aurafit_cloud_sync (sync_key, sync_data, updated_at, updated_by)
        VALUES (${cleanKey}, ${JSON.stringify(body.data)}, NOW(), ${updatedBy})
        ON CONFLICT (sync_key) DO UPDATE SET
          sync_data = EXCLUDED.sync_data,
          updated_at = NOW(),
          updated_by = EXCLUDED.updated_by
      `;
      syncedCount++;
    }

    // 2. Safe Legacy Daily Logs Upsert (if present)
    const rawLog = body?.dayLog;
    if (rawLog && typeof rawLog === 'object') {
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

      try {
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
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `;

        // Constraint-proof safe upsert: DELETE matching profile+date, then INSERT
        await sql`DELETE FROM aurafit_daily_logs WHERE profile_id = ${profileId} AND log_date = ${logDate}::date`;
        await sql`
          INSERT INTO aurafit_daily_logs (
            profile_id, log_date, creatine_done, mindvalley_done, mindvalley_lesson,
            water_ml, sleep_hours, sleep_quality, body_weight_kg,
            workout_mode, workout_completed, updated_at
          ) VALUES (
            ${profileId}, ${logDate}::date, ${creatineDone}, ${mindvalleyDone}, ${mindvalleyLesson},
            ${waterMl}, ${sleepHours}, ${sleepQuality}, ${bodyWeightKg},
            ${workoutMode}, ${workoutCompleted}, NOW()
          )
        `;
      } catch (errLog) {
        console.warn('[Sync] daily log insert warning:', errLog.message);
      }
    }

    return NextResponse.json({
      ok: true,
      mode: 'neon-postgres',
      synced: true,
      syncedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Sync POST error]:', error);
    return NextResponse.json({
      ok: true,
      mode: 'localStorage',
      synced: false,
      error: error.message
    });
  }
}
