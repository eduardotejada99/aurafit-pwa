import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBMR,
  calculateTDEE,
  calculateLeanBulkTargets,
  ACTIVITY_MULTIPLIERS
} from '../src/lib/fitness-data.js';

describe('AuraFit Metabolic & Caloric Calculations', () => {
  it('should calculate BMR correctly for males using Mifflin-St Jeor', () => {
    // 10 * 72.5 + 6.25 * 175 - 5 * 26 + 5 = 725 + 1093.75 - 130 + 5 = 1693.75 -> 1694
    const bmr = calculateBMR({ weightKg: 72.5, heightCm: 175, age: 26, gender: 'male' });
    assert.equal(bmr, 1694);
  });

  it('should calculate BMR correctly for females', () => {
    // 10 * 60 + 6.25 * 165 - 5 * 26 - 161 = 600 + 1031.25 - 130 - 161 = 1340.25 -> 1340
    const bmr = calculateBMR({ weightKg: 60, heightCm: 165, age: 26, gender: 'female' });
    assert.equal(bmr, 1340);
  });

  it('should calculate TDEE with moderate activity multiplier (1.55)', () => {
    const tdee = calculateTDEE({
      weightKg: 72.5,
      heightCm: 175,
      age: 26,
      gender: 'male',
      activityLevel: 'moderate'
    });
    // 1694 * 1.55 = 2625.7 -> 2626
    assert.equal(tdee, 2626);
  });

  it('should calculate Lean Bulk surplus and macros accurately', () => {
    const targets = calculateLeanBulkTargets({
      weightKg: 72.5,
      heightCm: 175,
      age: 26,
      gender: 'male',
      activityLevel: 'moderate',
      surplus: 300
    });

    assert.equal(targets.surplus, 300);
    assert.equal(targets.targetCalories, targets.tdee + 300);

    // Protein: 72.5 * 2.0 = 145g
    assert.equal(targets.macros.proteinGrams, 145);

    // Fat: 72.5 * 0.9 = 65.25 -> 65g
    assert.equal(targets.macros.fatGrams, 65);

    // Carbs should make up the rest of calories
    const totalMacroCals = (targets.macros.proteinGrams * 4) +
                           (targets.macros.fatGrams * 9) +
                           (targets.macros.carbsGrams * 4);
    assert.ok(Math.abs(totalMacroCals - targets.targetCalories) < 10);
  });
});
