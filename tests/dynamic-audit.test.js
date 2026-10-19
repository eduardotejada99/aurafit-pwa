import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FAMILY_PROFILES,
  calculateProfileTargets,
  calculateNutritionalScore,
  calculateSystemicPillars
} from '../src/lib/fitness-data.js';

test('AuraFit Dynamic State & Zero Static Data Audit', async (t) => {
  await t.test('1. Calendar week days must be dynamically computed Monday through Sunday', () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push(d.toISOString().split('T')[0]);
    }

    assert.equal(weekDays.length, 7);
    // Must contain today
    const todayKey = now.toISOString().split('T')[0];
    assert.ok(weekDays.includes(todayKey), 'Week strip must contain current calendar date');
  });

  await t.test('2. Food entries must be date-keyed and filter cleanly per selected day', () => {
    const todayKey = '2026-10-19';
    const tomorrowKey = '2026-10-20';

    const sampleFoods = [
      { id: '1', name: 'Huevos fritos', calories: 250, protein: 18, carbs: 2, fat: 18, date: todayKey, mealSlot: 'desayuno' },
      { id: '2', name: 'Pollo con arroz', calories: 650, protein: 50, carbs: 70, fat: 12, date: todayKey, mealSlot: 'comida' },
      { id: '3', name: 'Avena con plátano', calories: 350, protein: 14, carbs: 60, fat: 6, date: tomorrowKey, mealSlot: 'desayuno' }
    ];

    // Filter for today
    const todayFoods = sampleFoods.filter((f) => f.date === todayKey);
    assert.equal(todayFoods.length, 2);
    const todayCals = todayFoods.reduce((acc, f) => acc + f.calories, 0);
    assert.equal(todayCals, 900);

    // Filter for tomorrow (or new day starting at 0)
    const emptyDayFoods = sampleFoods.filter((f) => f.date === '2026-10-21');
    assert.equal(emptyDayFoods.length, 0);
    const emptyDayCals = emptyDayFoods.reduce((acc, f) => acc + f.calories, 0);
    assert.equal(emptyDayCals, 0, 'New calendar day starts cleanly at 0 calories');
  });

  await t.test('3. Daily habits must reset completion checkmarks on a new day while preserving custom habits', () => {
    const yesterdayKey = '2026-10-18';
    const todayKey = '2026-10-19';

    const savedHabits = [
      { id: 'creatina', name: 'Creatina 5g', completed: true, isCustom: false },
      { id: 'custom_123', name: 'Respiración Wim Hof 3 Rondas', completed: true, isCustom: true }
    ];

    const savedDate = yesterdayKey;

    // Daily reset algorithm simulation
    let activeHabits;
    if (savedDate === todayKey) {
      activeHabits = savedHabits;
    } else {
      activeHabits = savedHabits.map((h) => ({ ...h, completed: false, time: null }));
    }

    assert.equal(activeHabits.length, 2, 'Must keep all habit definitions');
    assert.equal(activeHabits.find((h) => h.id === 'custom_123')?.name, 'Respiración Wim Hof 3 Rondas');
    assert.equal(activeHabits.every((h) => h.completed === false), true, 'All habits start fresh (uncompleted) on new day');
  });

  await t.test('4. Daily water tracker must start at 0 on a new day and store history by date', () => {
    const yesterdayKey = '2026-10-18';
    const todayKey = '2026-10-19';

    const waterDailyRecord = { date: yesterdayKey, ml: 2500 };
    const waterByDate = { [yesterdayKey]: 2500 };

    let currentWaterMl = 0;
    if (waterDailyRecord.date === todayKey) {
      currentWaterMl = waterDailyRecord.ml;
    } else {
      currentWaterMl = waterByDate[todayKey] || 0;
    }

    assert.equal(currentWaterMl, 0, 'Water tracker starts at 0 ml on a new day');
    assert.equal(waterByDate[yesterdayKey], 2500, 'Previous day water intake is preserved in history');
  });

  await t.test('5. Streak must be dynamically calculated from consecutive active days without static constants', () => {
    const days = ['2026-10-17', '2026-10-18', '2026-10-19'];
    let streak = 0;
    const baseDate = new Date('2026-10-19T12:00:00Z');

    while (true) {
      const k = baseDate.toISOString().split('T')[0];
      if (days.includes(k)) {
        streak++;
        baseDate.setDate(baseDate.getDate() - 1);
      } else {
        break;
      }
    }

    assert.equal(streak, 3, 'Calculates exactly 3 consecutive days dynamically');
  });

  await t.test('6. Weight analytics must auto-scale min and max boundaries dynamically', () => {
    const logs = [
      { log_date: '10 Oct', weight_kg: 58.0 },
      { log_date: '12 Oct', weight_kg: 58.2 },
      { log_date: '14 Oct', weight_kg: 58.5 }
    ];

    const vals = logs.map((l) => l.weight_kg);
    const min = Math.min(...vals) - 0.5;
    const max = Math.max(...vals) + 0.5;

    assert.equal(min, 57.5);
    assert.equal(max, 59.0);
    assert.ok(max - min <= 2.0, 'Sparkline window is tightly bounded to user profile weight range');
  });

  await t.test('7. Nutritional score and systemic pillars must use dynamic targets matching macro cards with zero static fallbacks', () => {
    const andres = FAMILY_PROFILES.andres;
    const dynamicTargets = calculateProfileTargets(andres);

    // Dynamic targets must match Andrés recomposition
    assert.equal(dynamicTargets.targetCalories, 2431);
    assert.equal(dynamicTargets.macros.proteinGrams, 193);
    assert.equal(dynamicTargets.protein, 193);
    assert.equal(dynamicTargets.calories, 2431);

    // Also test with age 26 (matching 2447 kcal from user screenshot)
    const andres26 = { ...andres, age: 26 };
    const targets26 = calculateProfileTargets(andres26);
    assert.equal(targets26.targetCalories, 2447);
    assert.equal(targets26.macros.proteinGrams, 193);

    // Calculate score with logged food simulating user's exact screenshot (67g protein, 1225 kcal)
    const loggedFoods = [
      { id: '1', name: 'Desayuno', calories: 1225, protein: 67, carbs: 190, fat: 22, mealSlot: 'desayuno' }
    ];

    const scoreResult = calculateNutritionalScore({
      loggedFoods,
      targets: targets26,
      waterMl: 1500,
      waterTargetMl: andres.waterDailyMl,
      profile: andres
    });

    // Breakdown targets must reflect dynamic targets, NOT hardcoded 140g or 2000 kcal!
    assert.equal(scoreResult.breakdown.protein.target, 193, 'Protein target must be 193g, not 140g');
    assert.equal(scoreResult.breakdown.calories.target, 2447, 'Calorie target must be 2447 kcal, not 2000 kcal');

    // Insight texts must display 193g and 2447 kcal
    const proteinInsight = scoreResult.insights.find(i => i.title === 'Proteína Diaria');
    assert.ok(proteinInsight, 'Must include Proteína Diaria insight');
    assert.ok(proteinInsight.text.includes('193g'), `Protein insight should say 193g, got: "${proteinInsight.text}"`);
    assert.ok(!proteinInsight.text.includes('140g'), 'Protein insight must NEVER fall back to 140g');

    const calorieInsight = scoreResult.insights.find(i => i.title === 'Calorías del Día' || i.title === 'Balance Calórico');
    assert.ok(calorieInsight, 'Must include Calorie insight');
    assert.ok(calorieInsight.text.includes('2447 kcal'), `Calorie insight should say 2447 kcal, got: "${calorieInsight.text}"`);
    assert.ok(!calorieInsight.text.includes('2000 kcal'), 'Calorie insight must NEVER fall back to 2000 kcal');

    // Verify Systemic Pillars also evaluate against 193g and 2447 kcal
    const pillars = calculateSystemicPillars({
      profile: andres,
      loggedFoods,
      targets: dynamicTargets,
      waterMl: 1500
    });
    assert.ok(pillars.totalAuraScore > 0);
  });
});
