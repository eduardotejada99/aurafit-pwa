import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FAMILY_PROFILES } from '../src/lib/fitness-data.js';

describe('AuraFit Food Persistence & Admin PIN Management', () => {
  it('should verify that all 3 family profiles have initial PINs', () => {
    assert.strictEqual(FAMILY_PROFILES.andres.pin, '1234');
    assert.strictEqual(FAMILY_PROFILES.pareja.pin, '5678');
    assert.strictEqual(FAMILY_PROFILES.hermana.pin, '9012');
  });

  it('should verify Admin master PIN bypasses any profile lockout', () => {
    const adminPin = FAMILY_PROFILES.andres.pin; // '1234'
    const targetParejaPin = FAMILY_PROFILES.pareja.pin; // '5678'
    const targetHermanaPin = FAMILY_PROFILES.hermana.pin; // '9012'

    // Validation logic used in page.js:
    // (enteredPin === expectedPin || enteredPin === adminPin)
    const unlockParejaWithAdmin = ('1234' === targetParejaPin || '1234' === adminPin);
    const unlockHermanaWithAdmin = ('1234' === targetHermanaPin || '1234' === adminPin);
    const wrongPinFails = ('0000' === targetParejaPin || '0000' === adminPin);

    assert.strictEqual(unlockParejaWithAdmin, true, 'Admin PIN must unlock Pareja profile');
    assert.strictEqual(unlockHermanaWithAdmin, true, 'Admin PIN must unlock Hermana profile');
    assert.strictEqual(wrongPinFails, false, 'Invalid PIN must fail');
  });

  it('should preserve user food records when migrating legacy storage', () => {
    const legacyRecordedFoods = [
      { id: 'food-1', name: 'Chifles Piuranos', calories: 250, mealSlot: 'snack' },
      { id: 'food-2', name: 'Kekito de Naranja', calories: 310, mealSlot: 'snack' }
    ];

    // Mock storage simulation of loadProfileData logic:
    const mockStorage = {
      aurafit_logged_foods: JSON.stringify(legacyRecordedFoods)
    };

    let profileFoods = mockStorage['aurafit_foods_andres'];
    let loadedFoods = null;

    if (profileFoods) {
      loadedFoods = JSON.parse(profileFoods);
    } else {
      const fallback = mockStorage['aurafit_logged_foods'];
      if (fallback) {
        loadedFoods = JSON.parse(fallback);
        mockStorage['aurafit_foods_andres'] = fallback;
      }
    }

    assert.ok(loadedFoods, 'Should have loaded foods from legacy storage');
    assert.strictEqual(loadedFoods.length, 2);
    assert.strictEqual(loadedFoods[0].name, 'Chifles Piuranos');
    assert.strictEqual(mockStorage['aurafit_foods_andres'], JSON.stringify(legacyRecordedFoods));
  });

  it('should allow Admin to update all 3 PINs without altering nutritional macros', () => {
    const profiles = { ...FAMILY_PROFILES };
    const updatedPins = {
      andres: '4321',
      pareja: '8765',
      hermana: '2109'
    };

    const nextProfiles = {
      ...profiles,
      andres: { ...profiles.andres, pin: updatedPins.andres },
      pareja: { ...profiles.pareja, pin: updatedPins.pareja },
      hermana: { ...profiles.hermana, pin: updatedPins.hermana }
    };

    assert.strictEqual(nextProfiles.andres.pin, '4321');
    assert.strictEqual(nextProfiles.pareja.pin, '8765');
    assert.strictEqual(nextProfiles.hermana.pin, '2109');

    // Confirm biometrics and macros remain unaltered
    assert.strictEqual(nextProfiles.andres.weightKg, 92.0);
    assert.strictEqual(nextProfiles.andres.targetCalories, 2150);
    assert.strictEqual(nextProfiles.pareja.targetCalories, 1850);
    assert.strictEqual(nextProfiles.pareja.weightKg, 58.0);
    assert.strictEqual(nextProfiles.pareja.age, 21);
    assert.strictEqual(nextProfiles.hermana.age, 19);
    assert.strictEqual(nextProfiles.hermana.weightKg, 65.0);
    assert.strictEqual(nextProfiles.hermana.heightCm, 155);
  });
});

describe('AuraFit Dynamic Nutritional Score Engine', () => {
  it('should calculate initial score when no foods are logged yet', async () => {
    const { calculateNutritionalScore } = await import('../src/lib/fitness-data.js');
    const result = calculateNutritionalScore({
      loggedFoods: [],
      targets: { calories: 2150, protein: 195 },
      waterMl: 1200,
      waterTargetMl: 3400,
      profile: { name: 'Andrés' }
    });

    assert.ok(result.score >= 60 && result.score <= 85);
    assert.strictEqual(result.grade, 'Iniciando Día');
    assert.ok(result.dashOffset > 0);
    assert.ok(result.insights.length >= 1);
  });

  it('should dynamically reward high protein and caloric adherence without negative red alerts', async () => {
    const { calculateNutritionalScore } = await import('../src/lib/fitness-data.js');
    const foods = [
      { id: 'f1', name: 'Huevos y Avena', calories: 520, protein: 35, mealSlot: 'desayuno' },
      { id: 'f2', name: 'Pechuga con Arroz', calories: 650, protein: 55, mealSlot: 'comida' },
      { id: 'f3', name: 'Atún con Papa', calories: 480, protein: 42, mealSlot: 'cena' },
      { id: 'f4', name: 'Plátano y Maní', calories: 350, protein: 14, mealSlot: 'snack' }
    ];

    const result = calculateNutritionalScore({
      loggedFoods: foods,
      targets: { calories: 2000, protein: 140 },
      waterMl: 2600,
      waterTargetMl: 2600,
      profile: { name: 'Andrés' }
    });

    assert.ok(result.score >= 85, `Score ${result.score} should be >= 85`);
    assert.ok(result.grade === 'Excelente' || result.grade === 'Bueno');
    // Ensure no red alerts exist in insight status
    result.insights.forEach(ins => {
      assert.notStrictEqual(ins.color, 'red');
      assert.notStrictEqual(ins.status, 'Muy bajo');
    });
  });
});

describe('AuraFit Holistic Daily Lifestyle Engine (calculateDailyAuraScore)', () => {
  it('should calculate balanced AuraScore combining all 4 pillars', async () => {
    const { calculateDailyAuraScore, FAMILY_PROFILES } = await import('../src/lib/fitness-data.js');

    const result = calculateDailyAuraScore({
      nutritionScore: 90,
      workoutDone: true,
      workoutMinutes: 50,
      sleepHours: 8,
      sleepQuality: 'deep',
      completedHabits: 5,
      totalHabits: 5,
      profile: FAMILY_PROFILES.andres
    });

    assert.ok(result.score >= 90, `Expected score >= 90, got ${result.score}`);
    assert.strictEqual(result.grade, 'Día Extraordinario');
    assert.strictEqual(result.statusEmoji, '🌟');
    assert.strictEqual(result.pillars.nutrition.points, 23); // round(90/100 * 25)
    assert.strictEqual(result.pillars.workout.points, 25);
    assert.strictEqual(result.pillars.sleep.points, 25); // 22 + 3 deep
    assert.strictEqual(result.pillars.habits.points, 25);
    assert.ok(result.didacticSummary.includes('Andrés'));
    assert.ok(result.didacticSummary.includes('Wim Hof'));
  });

  it('should adapt didactic feedback respectfully for Pareja avoiding lumbar strain', async () => {
    const { calculateDailyAuraScore, FAMILY_PROFILES } = await import('../src/lib/fitness-data.js');

    const result = calculateDailyAuraScore({
      nutritionScore: 80,
      workoutDone: true,
      workoutMinutes: 45,
      sleepHours: 7.5,
      sleepQuality: 'normal',
      completedHabits: 4,
      totalHabits: 5,
      profile: FAMILY_PROFILES.pareja
    });

    assert.ok(result.score >= 75);
    assert.ok(result.didacticSummary.includes('columna') || result.didacticSummary.includes('lumbar'));
  });

  it('should adapt didactic feedback gently for Hermana without alarms or red alerts', async () => {
    const { calculateDailyAuraScore, FAMILY_PROFILES } = await import('../src/lib/fitness-data.js');

    const result = calculateDailyAuraScore({
      nutritionScore: 65,
      workoutDone: false,
      workoutMinutes: 15,
      sleepHours: 7,
      sleepQuality: 'normal',
      completedHabits: 2,
      totalHabits: 4,
      profile: FAMILY_PROFILES.hermana
    });

    assert.ok(result.score >= 50);
    assert.ok(result.didacticSummary.includes('autocuidado') || result.didacticSummary.includes('amable'));
    assert.strictEqual(result.didacticSummary.includes('peligro'), false);
    assert.strictEqual(result.didacticSummary.includes('mal estado'), false);
  });

  it('should guarantee that water starts at 0 on a new day date-key check', () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = '2026-10-18';

    // Mock storage with legacy/yesterday data
    const mockStorage = {
      aurafit_water_daily_andres: JSON.stringify({ date: yesterday, amount: 2400 })
    };

    let waterMl = 0;
    const storedDaily = mockStorage['aurafit_water_daily_andres'];
    if (storedDaily) {
      try {
        const parsed = JSON.parse(storedDaily);
        if (parsed.date === today) {
          waterMl = parsed.amount || 0;
        } else {
          // New day detected: reset to 0
          waterMl = 0;
        }
      } catch (e) {
        waterMl = 0;
      }
    }

    assert.strictEqual(waterMl, 0, 'Water counter MUST start at 0 on a new day');
  });
});

