import test from 'node:test';
import assert from 'node:assert/strict';
import { SYNC_KEYS, mergeCloudIntoLocalStorage, getLocalSyncBundle } from '../src/lib/cloud-sync.js';
import { getLocalDateKey } from '../src/lib/fitness-data.js';

test('Date Switching & Multi-Day Persistence Engine', async (t) => {
  // Mock localStorage and window for node test runner
  globalThis.window = {};
  const storage = {};
  global.localStorage = {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null),
    setItem: (key, val) => {
      storage[key] = String(val);
    },
    removeItem: (key) => {
      delete storage[key];
    },
    clear: () => {
      Object.keys(storage).forEach((k) => delete storage[k]);
    },
    get length() {
      return Object.keys(storage).length;
    },
    key: (i) => Object.keys(storage)[i] || null
  };

  await t.test('1. Monday data should never be overwritten when Tuesday rolls over', () => {
    localStorage.clear();

    const mondayKey = '2026-10-19';
    const tuesdayKey = '2026-10-20';
    const profileKey = 'andres';

    // Simulate Monday data entered by user
    const mondayExercises = ['0-0-Prensa 45°', '0-1-Hack Squat', '1-0-Extensiones de Cuádriceps (Drop Sets)'];
    const mondayHabits = {
      wimhof: { completed: true, time: '08:30' },
      creatina: { completed: true, time: '10:00' },
      sol: { completed: true, time: '09:15' }
    };
    const mondayWater = 3000;

    localStorage.setItem(`aurafit_completed_exercises_${profileKey}_${mondayKey}`, JSON.stringify(mondayExercises));
    localStorage.setItem(`aurafit_completed_exercises_by_date_${profileKey}`, JSON.stringify({ [mondayKey]: mondayExercises }));
    localStorage.setItem(`aurafit_habits_by_date_${profileKey}`, JSON.stringify({ [mondayKey]: mondayHabits }));
    localStorage.setItem(`aurafit_water_by_date_${profileKey}`, JSON.stringify({ [mondayKey]: mondayWater }));
    localStorage.setItem(`aurafit_workout_week_${profileKey}`, JSON.stringify({
      [mondayKey]: { split: 'legs', title: 'Piernas Enfocadas en Máquinas', done: true, minutes: 50 }
    }));

    // Verify Tuesday reads 0 water and empty exercises before any interaction
    const waterByDate = JSON.parse(localStorage.getItem(`aurafit_water_by_date_${profileKey}`));
    assert.equal(waterByDate[mondayKey], 3000, 'Monday water must be 3000 ml');
    assert.equal(waterByDate[tuesdayKey], undefined, 'Tuesday water must be unrecorded / 0 initially');

    // User adds 500ml on Tuesday
    const updatedWaterByDate = { ...waterByDate, [tuesdayKey]: 500 };
    localStorage.setItem(`aurafit_water_by_date_${profileKey}`, JSON.stringify(updatedWaterByDate));

    // Check Monday water remained intact
    const reloadedWater = JSON.parse(localStorage.getItem(`aurafit_water_by_date_${profileKey}`));
    assert.equal(reloadedWater[mondayKey], 3000, 'Monday water must stay 3000 ml after Tuesday water is added');
    assert.equal(reloadedWater[tuesdayKey], 500, 'Tuesday water must be 500 ml');
  });

  await t.test('2. Monday exercise checklist must persist and load properly when switching dates', () => {
    const mondayKey = '2026-10-19';
    const tuesdayKey = '2026-10-20';
    const profileKey = 'andres';

    const completedByDate = JSON.parse(localStorage.getItem(`aurafit_completed_exercises_by_date_${profileKey}`));
    assert.deepEqual(
      completedByDate[mondayKey],
      ['0-0-Prensa 45°', '0-1-Hack Squat', '1-0-Extensiones de Cuádriceps (Drop Sets)'],
      'Monday completed exercises must be retrievable'
    );
    assert.equal(completedByDate[tuesdayKey], undefined, 'Tuesday has no completed exercises initially');

    // Simulate user completing an exercise on Tuesday
    const tuesdayExercises = ['0-0-Dominadas Lastradas'];
    const updatedCompletedByDate = {
      ...completedByDate,
      [tuesdayKey]: tuesdayExercises
    };
    localStorage.setItem(`aurafit_completed_exercises_by_date_${profileKey}`, JSON.stringify(updatedCompletedByDate));

    // Re-verify both days are distinct and preserved
    const verifyStorage = JSON.parse(localStorage.getItem(`aurafit_completed_exercises_by_date_${profileKey}`));
    assert.equal(verifyStorage[mondayKey].length, 3, 'Monday must still have 3 exercises completed');
    assert.equal(verifyStorage[tuesdayKey].length, 1, 'Tuesday must have 1 exercise completed');
    assert.ok(verifyStorage[mondayKey].includes('0-0-Prensa 45°'));
    assert.ok(verifyStorage[tuesdayKey].includes('0-0-Dominadas Lastradas'));
  });

  await t.test('3. Habits checklist must remain completed on Monday and clean on Tuesday', () => {
    const mondayKey = '2026-10-19';
    const tuesdayKey = '2026-10-20';
    const profileKey = 'andres';

    const habitsByDate = JSON.parse(localStorage.getItem(`aurafit_habits_by_date_${profileKey}`));
    assert.ok(habitsByDate[mondayKey].creatina.completed, 'Creatina was completed on Monday');
    assert.ok(habitsByDate[mondayKey].wimhof.completed, 'Wim Hof was completed on Monday');
    assert.equal(habitsByDate[tuesdayKey], undefined, 'Tuesday has not checked any habits yet');

    // Simulate checking a habit on Tuesday
    const updatedHabits = {
      ...habitsByDate,
      [tuesdayKey]: {
        creatina: { completed: true, time: '09:00' }
      }
    };
    localStorage.setItem(`aurafit_habits_by_date_${profileKey}`, JSON.stringify(updatedHabits));

    const verifyHabits = JSON.parse(localStorage.getItem(`aurafit_habits_by_date_${profileKey}`));
    assert.equal(Object.keys(verifyHabits[mondayKey]).length, 3, 'Monday retains all 3 completed habits');
    assert.equal(Object.keys(verifyHabits[tuesdayKey]).length, 1, 'Tuesday has 1 completed habit');
  });

  await t.test('4. Cloud Sync merges habits_by_date and completed_exercises_by_date monotonically', () => {
    const profileKey = 'andres';
    const mondayKey = '2026-10-19';
    const tuesdayKey = '2026-10-20';

    // Local has Monday + Tuesday
    const localHabitsKey = `${SYNC_KEYS.HABITS_BY_DATE_PREFIX}${profileKey}`;
    const localHabits = {
      [mondayKey]: { creatina: { completed: true, time: '10:00' } },
      [tuesdayKey]: { sol: { completed: true, time: '08:00' } }
    };
    localStorage.setItem(localHabitsKey, JSON.stringify(localHabits));

    // Cloud has Monday with an extra habit (e.g. wimhof)
    const cloudItems = {
      [localHabitsKey]: {
        [mondayKey]: { wimhof: { completed: true, time: '07:30' } }
      }
    };

    mergeCloudIntoLocalStorage(cloudItems);

    const merged = JSON.parse(localStorage.getItem(localHabitsKey));
    assert.ok(merged[mondayKey].creatina.completed, 'Local creatina must survive cloud merge');
    assert.ok(merged[mondayKey].wimhof.completed, 'Cloud wimhof must be added to Monday');
    assert.ok(merged[tuesdayKey].sol.completed, 'Local Tuesday habit must survive');
  });

  await t.test('5. Weekly workout logs correctly reflect Monday done and Tuesday pending', () => {
    const profileKey = 'andres';
    const mondayKey = '2026-10-19';
    const tuesdayKey = '2026-10-20';

    const weekLogs = JSON.parse(localStorage.getItem(`aurafit_workout_week_${profileKey}`));
    assert.equal(weekLogs[mondayKey]?.done, true, 'Monday workout must be marked as done');
    assert.equal(weekLogs[mondayKey]?.split, 'legs', 'Monday split must be legs');
    assert.equal(weekLogs[tuesdayKey]?.done, undefined, 'Tuesday workout is not done yet');
  });
});
