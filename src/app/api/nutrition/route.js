import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateMealsFromPantry, calculateLeanBulkTargets, DEFAULT_USER_PROFILE } from '@/lib/fitness-data';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ingredientsParam = searchParams.get('ingredients');
  const ingredients = ingredientsParam ? ingredientsParam.split(',').map(s => s.trim()) : [];

  const targets = calculateLeanBulkTargets({
    weightKg: DEFAULT_USER_PROFILE.weightKg,
    heightCm: DEFAULT_USER_PROFILE.heightCm,
    age: DEFAULT_USER_PROFILE.age,
    activityLevel: DEFAULT_USER_PROFILE.activityLevel,
    surplus: 300
  });

  const suggestedMeals = generateMealsFromPantry(ingredients);

  return NextResponse.json({
    success: true,
    targets,
    suggestedMeals
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { mealName, calories, proteinG, carbsG, fatG, isDamageControl, notes } = body;

    await query(
      `INSERT INTO nutrition_logs (meal_type, meal_name, calories, protein_g, carbs_g, fat_g, is_damage_control, damage_control_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      ['meal', mealName || 'Registro Rápido', calories || 500, proteinG || 30, carbsG || 50, fatG || 15, isDamageControl || false, notes || '']
    );

    return NextResponse.json({ success: true, registered: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
