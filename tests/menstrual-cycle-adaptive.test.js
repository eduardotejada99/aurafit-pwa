import test from 'node:test';
import assert from 'node:assert';
import {
  calculateMenstrualCyclePhase,
  DEFAULT_CYCLE_CONFIGS,
  MENSTRUAL_PHASES_METADATA
} from '../src/lib/fitness-data.js';

test('AuraFit Menstrual Cycle Tracking & Adaptive Hormonal Engine', async (t) => {
  await t.test('should correctly identify Menstrual Phase (Day 1 to 5) with bleeding indicator', () => {
    // Start date 2026-10-06, target 2026-10-06 (Day 1)
    const day1 = calculateMenstrualCyclePhase({
      targetDate: '2026-10-06',
      lastPeriodStartDate: '2026-10-06',
      cycleLengthDays: 28,
      periodDurationDays: 5,
      profileId: 'pareja'
    });

    assert.strictEqual(day1.cycleDay, 1);
    assert.strictEqual(day1.phaseId, 'menstrual');
    assert.strictEqual(day1.isBleedingDay, true);
    assert.strictEqual(day1.icon, '🩸');
    assert.strictEqual(day1.daysUntilNextPeriod, 28);
    assert.ok(day1.workoutAdvice.includes('Cero compresión lumbar'));
    assert.ok(day1.nutritionAdvice.includes('hierro'));

    // Day 4 (2026-10-09)
    const day4 = calculateMenstrualCyclePhase({
      targetDate: '2026-10-09',
      lastPeriodStartDate: '2026-10-06',
      cycleLengthDays: 28,
      periodDurationDays: 5,
      profileId: 'pareja'
    });
    assert.strictEqual(day4.cycleDay, 4);
    assert.strictEqual(day4.phaseId, 'menstrual');
    assert.strictEqual(day4.isBleedingDay, true);
  });

  await t.test('should identify Follicular Phase (Days 6-11) with progressive overload advice', () => {
    // Day 8 (2026-10-13)
    const day8 = calculateMenstrualCyclePhase({
      targetDate: '2026-10-13',
      lastPeriodStartDate: '2026-10-06',
      cycleLengthDays: 28,
      periodDurationDays: 5,
      profileId: 'pareja'
    });

    assert.strictEqual(day8.cycleDay, 8);
    assert.strictEqual(day8.phaseId, 'follicular');
    assert.strictEqual(day8.isBleedingDay, false);
    assert.strictEqual(day8.icon, '🌿');
    assert.ok(day8.workoutAdvice.includes('sobrecarga progresiva'));
    assert.ok(day8.nutritionAdvice.includes('carbohidratos complejos'));
  });

  await t.test('should identify Ovulatory Phase peak (Day 14) with PR & maximum strength guidance', () => {
    // Day 14 (2026-10-19)
    const day14 = calculateMenstrualCyclePhase({
      targetDate: '2026-10-19',
      lastPeriodStartDate: '2026-10-06',
      cycleLengthDays: 28,
      periodDurationDays: 5,
      profileId: 'pareja'
    });

    assert.strictEqual(day14.cycleDay, 14);
    assert.strictEqual(day14.phaseId, 'ovulatory');
    assert.strictEqual(day14.icon, '✨');
    assert.ok(day14.workoutAdvice.includes('Pico de fuerza del mes'));
    assert.strictEqual(day14.daysUntilNextPeriod, 15);
  });

  await t.test('should identify Early Luteal Phase (Days 17-22) with Zone 2 and moderate hypertrophy', () => {
    // Day 20 (2026-10-25)
    const day20 = calculateMenstrualCyclePhase({
      targetDate: '2026-10-25',
      lastPeriodStartDate: '2026-10-06',
      cycleLengthDays: 28,
      periodDurationDays: 5,
      profileId: 'pareja'
    });

    assert.strictEqual(day20.cycleDay, 20);
    assert.strictEqual(day20.phaseId, 'luteal_early');
    assert.strictEqual(day20.icon, '🌙');
    assert.ok(day20.workoutAdvice.includes('Hipertrofia'));
    assert.ok(day20.nutritionAdvice.includes('grasas de calidad'));
  });

  await t.test('should identify Premenstrual / Late Luteal Phase (Days 23-28) with deload & magnesium advice', () => {
    // Day 26 (2026-10-31)
    const day26 = calculateMenstrualCyclePhase({
      targetDate: '2026-10-31',
      lastPeriodStartDate: '2026-10-06',
      cycleLengthDays: 28,
      periodDurationDays: 5,
      profileId: 'pareja'
    });

    assert.strictEqual(day26.cycleDay, 26);
    assert.strictEqual(day26.phaseId, 'luteal_late');
    assert.strictEqual(day26.icon, '🛡️');
    assert.strictEqual(day26.daysUntilNextPeriod, 3);
    assert.ok(day26.workoutAdvice.includes('Deload preventivo'));
    assert.ok(day26.nutritionAdvice.includes('Magnesio bisglicinato'));
  });

  await t.test('should seamlessly wrap cycle when diffDays exceeds cycleLength', () => {
    // 29 days after Oct 6 is Nov 4 (Day 2 of new cycle)
    const nextCycleDay2 = calculateMenstrualCyclePhase({
      targetDate: '2026-11-04',
      lastPeriodStartDate: '2026-10-06',
      cycleLengthDays: 28,
      periodDurationDays: 5,
      profileId: 'pareja'
    });

    assert.strictEqual(nextCycleDay2.cycleDay, 2);
    assert.strictEqual(nextCycleDay2.phaseId, 'menstrual');
    assert.strictEqual(nextCycleDay2.isBleedingDay, true);
  });

  await t.test('should adapt advice tone gently for Anicka (Hermana)', () => {
    const anickaMenstrual = calculateMenstrualCyclePhase({
      targetDate: '2026-10-14',
      lastPeriodStartDate: '2026-10-14',
      cycleLengthDays: 29,
      periodDurationDays: 5,
      profileId: 'hermana'
    });

    assert.strictEqual(anickaMenstrual.cycleDay, 1);
    assert.strictEqual(anickaMenstrual.phaseId, 'menstrual');
    assert.ok(anickaMenstrual.workoutAdvice.includes('descanso compasivo'));
  });

  await t.test('should dynamically adjust ovulation and luteal bounds for longer (35-day) cycles', () => {
    // 35 day cycle: Ovulation ~ day 21 (35 - 14)
    const day21 = calculateMenstrualCyclePhase({
      targetDate: '2026-10-27',
      lastPeriodStartDate: '2026-10-06',
      cycleLengthDays: 35,
      periodDurationDays: 5,
      profileId: 'pareja'
    });

    assert.strictEqual(day21.cycleDay, 22);
    assert.strictEqual(day21.phaseId, 'ovulatory');
    assert.strictEqual(day21.cycleLengthDays, 35);
  });

  await t.test('should verify default cycle configs for female profiles vs male', () => {
    assert.strictEqual(DEFAULT_CYCLE_CONFIGS.pareja.enabled, true);
    assert.strictEqual(DEFAULT_CYCLE_CONFIGS.pareja.cycleLengthDays, 28);
    assert.strictEqual(DEFAULT_CYCLE_CONFIGS.hermana.enabled, true);
    assert.strictEqual(DEFAULT_CYCLE_CONFIGS.hermana.cycleLengthDays, 29);
    assert.strictEqual(DEFAULT_CYCLE_CONFIGS.andres.enabled, false);
  });

  await t.test('should accurately simulate 1-tap period started today', () => {
    const today = '2026-10-19';
    const dayOneSimulated = calculateMenstrualCyclePhase({
      targetDate: today,
      lastPeriodStartDate: today,
      cycleLengthDays: 28,
      periodDurationDays: 5,
      profileId: 'pareja'
    });

    assert.strictEqual(dayOneSimulated.cycleDay, 1);
    assert.strictEqual(dayOneSimulated.phaseId, 'menstrual');
    assert.strictEqual(dayOneSimulated.isBleedingDay, true);
    assert.strictEqual(dayOneSimulated.daysUntilNextPeriod, 28);
  });
});
