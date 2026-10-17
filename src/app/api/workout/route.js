import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { WORKOUT_ROUTINES } from '@/lib/fitness-data';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'gym';

  const routine = WORKOUT_ROUTINES[mode] || WORKOUT_ROUTINES.gym;

  return NextResponse.json({
    success: true,
    mode,
    routine
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { workoutMode, routineName, durationMinutes, perceivedIntensity, exercisesData, notes } = body;

    await query(
      `INSERT INTO workout_logs (workout_mode, routine_name, duration_minutes, perceived_intensity, exercises_data, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        workoutMode || 'gym',
        routineName || 'Entrenamiento',
        durationMinutes || 45,
        perceivedIntensity || 8,
        JSON.stringify(exercisesData || []),
        notes || ''
      ]
    );

    return NextResponse.json({ success: true, saved: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
