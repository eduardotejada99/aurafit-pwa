import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  HYBRID_ATHLETE_SYSTEM,
  getHybridWorkoutPrescription,
  analyzeWeeklyWorkoutBalance,
  calculateSystemicPillars,
  calculateRecompositionDiagnostic,
  FAMILY_PROFILES
} from '../src/lib/fitness-data.js';

describe('AuraFit Systemic Pillars & Dynamic Workout Control', () => {
  it('should allow user full control over daily split (Legs, Push, Pull, Full Upper, Home Core)', () => {
    const splits = HYBRID_ATHLETE_SYSTEM.splits.andres;
    assert.ok(splits.legs, 'Should have dedicated Legs Heavy split');
    assert.ok(splits.push, 'Should have dedicated Push / Chest & Shoulders split');
    assert.ok(splits.pull, 'Should have dedicated Pull / Back & Lats split');
    assert.ok(splits.full_upper, 'Should have Full Upper hybrid split');
    assert.ok(splits.home_core, 'Should have Home Core Planks express routine');

    // Legs split must feature progressive overload
    assert.ok(splits.legs.blocks[0].exercises.some((e) => e.name.toLowerCase().includes('prensa') || e.name.toLowerCase().includes('sentadilla')));
    // Home core routine must be ~12 minutes with zero equipment
    assert.equal(splits.home_core.durationMinutes, 12);
    assert.ok(splits.home_core.blocks[0].exercises.some((e) => e.name.toLowerCase().includes('plancha')));
  });

  it('should prescribe selected split dynamically via getHybridWorkoutPrescription', () => {
    const legsWorkout = getHybridWorkoutPrescription({
      profile: FAMILY_PROFILES.andres,
      selectedSplit: 'legs',
      context: 'gym',
      sleepHours: 8,
      sleepQuality: 'deep'
    });

    assert.equal(legsWorkout.selectedSplit, 'legs');
    assert.ok(legsWorkout.routineTitle.toLowerCase().includes('piernas'));
    assert.ok(legsWorkout.blocks.length >= 2);
  });

  it('should dynamically prescribe 12-min Home Core Planks when user marks missed day', () => {
    const missedWorkout = getHybridWorkoutPrescription({
      profile: FAMILY_PROFILES.andres,
      isMissedDay: true,
      context: 'home_bars',
      sleepHours: 7.5
    });

    assert.equal(missedWorkout.selectedSplit, 'home_core');
    assert.equal(missedWorkout.durationMinutes, 12);
    assert.ok(missedWorkout.routineTitle.toLowerCase().includes('planchas'));
  });

  it('should analyze weekly logs and dynamically recommend Pull/Back if Legs was already completed', () => {
    const weeklyLogs = {
      '2026-10-19': { date: '2026-10-19', split: 'legs', title: 'Piernas Pesado', done: true, minutes: 90 }
    };

    const analysis = analyzeWeeklyWorkoutBalance({
      weeklyLogs,
      profileId: 'andres'
    });

    assert.equal(analysis.completedCount, 1);
    assert.equal(analysis.legsCount, 1);
    assert.equal(analysis.pullCount, 0);
    // Should recommend Pull or Push to balance the weekly stimulus
    assert.ok(analysis.recommendedSplit === 'pull' || analysis.recommendedSplit === 'push');
    assert.ok(analysis.weeklySummaryText.toLowerCase().includes('piernas'));
  });

  it('should calculate Systemic Pillars (0-100) and generate cross-pillar synergies', () => {
    const pillars = calculateSystemicPillars({
      profile: FAMILY_PROFILES.andres,
      loggedFoods: [
        { name: 'Pechuga de Pollo', calories: 450, protein: 55, carbs: 10, fat: 8 },
        { name: 'Arroz Blanco', calories: 380, protein: 8, carbs: 80, fat: 2 }
      ],
      targets: { targetCalories: 2150, protein: 195 },
      waterMl: 2800,
      sleepHours: 8,
      sleepQuality: 'deep',
      selectedSplit: 'legs',
      isMissedDay: false,
      todayWorkoutDone: true,
      habits: [
        { id: 'wimhof', completed: true },
        { id: 'creatine', completed: true }
      ]
    });

    assert.ok(pillars.totalAuraScore >= 70);
    assert.ok(pillars.breakdown.nutrition > 0);
    assert.ok(pillars.breakdown.workout > 0);
    assert.ok(pillars.breakdown.sleep > 0);
    assert.ok(pillars.breakdown.habits > 0);

    // Cross-pillar synergies must include peri-workout carb advice for Legs
    assert.ok(pillars.synergies.some((s) => s.category === 'nutrition_workout' && s.text.toLowerCase().includes('carbohidrato')));
    // Water hydration state
    assert.ok(pillars.synergies.some((s) => s.category === 'hydration_muscle'));
  });

  it('should adapt synergies for Pareja ensuring lumbar comfort and anti-inflammatory nutrition', () => {
    const parejaPillars = calculateSystemicPillars({
      profile: FAMILY_PROFILES.pareja,
      loggedFoods: [],
      targets: { targetCalories: 1850, protein: 120 },
      waterMl: 2000,
      sleepHours: 8,
      sleepQuality: 'deep',
      selectedSplit: 'glutes_legs',
      isMissedDay: false,
      todayWorkoutDone: true,
      habits: [
        { id: 'lumbar_relief', completed: true }
      ]
    });

    assert.ok(parejaPillars.synergies.some((s) => s.text.toLowerCase().includes('lumbar') || s.text.toLowerCase().includes('columna')));
  });

  it('should calculate intelligent recomposition diagnostic identifying muscle groups that fell short and prescribing fat loss finisher', () => {
    const weeklyLogs = {
      '2026-10-19': { date: '2026-10-19', split: 'legs', title: 'Piernas Pesado', done: true, minutes: 90 }
    };
    const exerciseLogs = {
      'Prensa de Piernas Inclinada a 45°': { weightKg: 160, reps: 10, date: '2026-10-19' },
      'Press de Banca Plano con Barra': { weightKg: 70, reps: 6, date: '2026-10-20' }
    };

    const diagnostic = calculateRecompositionDiagnostic({
      profile: FAMILY_PROFILES.andres,
      weeklyLogs,
      completedExercises: ['Prensa de Piernas Inclinada a 45°', 'Sentadilla Hack'],
      exerciseLogs,
      loggedFoods: [
        { name: 'Pechuga de Pollo', calories: 350, protein: 60 },
        { name: 'Arroz', calories: 260, protein: 5 }
      ],
      targetCalories: 2150,
      targetProtein: 195
    });

    assert.ok(diagnostic);
    assert.ok(diagnostic.recompositionScore > 0 && diagnostic.recompositionScore <= 100);
    assert.ok(diagnostic.groupsList.length === 6, 'Should track 6 primary muscle groups');

    // Piernas should have completed sets counted
    const piernas = diagnostic.groupsList.find((g) => g.key === 'piernas');
    assert.ok(piernas.completedSets > 0);

    // Espalda should be flagged as short since no back exercises were performed
    const espalda = diagnostic.groupsList.find((g) => g.key === 'espalda');
    assert.ok(espalda.deficitSets > 0);
    assert.ok(diagnostic.shortGroups.some((g) => g.key === 'espalda'));

    // Overload checks:
    // Prensa (10 reps >= 8) -> ready to increase
    const prensaOverload = diagnostic.overloadAudits.find((o) => o.exerciseName.includes('Prensa'));
    assert.equal(prensaOverload.status, 'ready_to_increase');
    assert.ok(prensaOverload.nextGoal.includes('+2.5 kg'));

    // Banca (6 reps < 8) -> consolidate reps
    const bancaOverload = diagnostic.overloadAudits.find((o) => o.exerciseName.includes('Banca'));
    assert.equal(bancaOverload.status, 'consolidating_reps');
    assert.ok(bancaOverload.nextGoal.includes('Mantén'));

    // Fat loss advice must include Zone 2 finisher
    assert.ok(diagnostic.fatLossDiagnostic.metabolicCardioAdvice.includes('Zona 2'));
    assert.ok(diagnostic.fatLossDiagnostic.metabolicCardioAdvice.includes('10 min'));

    // Three key adjustments
    assert.equal(diagnostic.threeKeyAdjustments.length, 3);
    assert.ok(diagnostic.threeKeyAdjustments[0].title);
    assert.ok(diagnostic.threeKeyAdjustments[1].title);
    assert.ok(diagnostic.threeKeyAdjustments[2].title.includes('Zona 2'));
  });
});

