import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getLocalDateKey } from '../src/lib/fitness-data.js';
import { mergeCloudIntoLocalStorage, SYNC_KEYS } from '../src/lib/cloud-sync.js';

describe('AuraFit Water Persistence & Cloud Sync Resilience Engine', () => {
  it('should maintain stable local date keys regardless of UTC timezone shifts in Peru', () => {
    // Simulated dates at 2:00 PM, 8:00 PM, and 11:59 PM Peru time (UTC-5)
    const dAfternoon = new Date('2026-10-19T14:00:00-05:00');
    const dNight = new Date('2026-10-19T20:00:00-05:00');
    const dMidnightEve = new Date('2026-10-19T23:59:59-05:00');

    assert.strictEqual(getLocalDateKey(dAfternoon), '2026-10-19', '14:00 should be 2026-10-19');
    assert.strictEqual(getLocalDateKey(dNight), '2026-10-19', '20:00 should remain 2026-10-19, not jump to tomorrow');
    assert.strictEqual(getLocalDateKey(dMidnightEve), '2026-10-19', '23:59 should remain 2026-10-19');

    // Note that standard toISOString() jumps to 2026-10-20 at 8 PM Peru time
    assert.strictEqual(dNight.toISOString().split('T')[0], '2026-10-20');
    // But getLocalDateKey stays on 2026-10-19!
    assert.strictEqual(getLocalDateKey(dNight), '2026-10-19');
  });

  it('should never wipe out or reset local water to 0 when cloud payload is empty or has older data', () => {
    const today = getLocalDateKey();
    const storageMap = {};

    // Mock window and localStorage
    globalThis.window = {};
    globalThis.localStorage = {
      getItem: (k) => storageMap[k] ?? null,
      setItem: (k, v) => { storageMap[k] = String(v); },
      removeItem: (k) => { delete storageMap[k]; }
    };

    // User logs 750 ml of water locally today
    const localWaterObj = { [today]: 750 };
    storageMap[`aurafit_water_by_date_andres`] = JSON.stringify(localWaterObj);
    storageMap[`aurafit_water_daily_andres`] = JSON.stringify({ date: today, ml: 750 });
    storageMap[`aurafit_water_andres`] = '750';

    // Cloud returns empty {} (e.g., initial sync or network latency before POST landed)
    mergeCloudIntoLocalStorage({
      aurafit_water_by_date_andres: {}
    });

    // Check that local 750 ml was strictly PRESERVED and not wiped to 0
    const merged = JSON.parse(storageMap[`aurafit_water_by_date_andres`]);
    assert.strictEqual(merged[today], 750, 'Local 750 ml MUST NOT be erased by empty cloud object');

    const daily = JSON.parse(storageMap[`aurafit_water_daily_andres`]);
    assert.strictEqual(daily.ml, 750, 'Daily water record MUST remain 750 ml');
    assert.strictEqual(storageMap[`aurafit_water_andres`], '750');
  });

  it('should perform monotonic maximum merge when cloud has partial or concurrent water data', () => {
    const today = getLocalDateKey();
    const storageMap = {};

    globalThis.window = {};
    globalThis.localStorage = {
      getItem: (k) => storageMap[k] ?? null,
      setItem: (k, v) => { storageMap[k] = String(v); },
      removeItem: (k) => { delete storageMap[k]; }
    };

    // Device A has 500 ml
    storageMap[`aurafit_water_by_date_andres`] = JSON.stringify({ [today]: 500, '2026-10-18': 2000 });

    // Cloud has 750 ml for today (logged on another phone) and 1800 for yesterday
    mergeCloudIntoLocalStorage({
      aurafit_water_by_date_andres: { [today]: 750, '2026-10-18': 1800 }
    });

    const merged = JSON.parse(storageMap[`aurafit_water_by_date_andres`]);
    // Today: max(500, 750) = 750
    assert.strictEqual(merged[today], 750, 'Today water should take maximum of local and cloud');
    // Yesterday: max(2000, 1800) = 2000
    assert.strictEqual(merged['2026-10-18'], 2000, 'Yesterday water should take maximum of local and cloud');
  });

  it('should safely merge foods and habits without deleting locally added items', () => {
    const storageMap = {};

    globalThis.window = {};
    globalThis.localStorage = {
      getItem: (k) => storageMap[k] ?? null,
      setItem: (k, v) => { storageMap[k] = String(v); },
      removeItem: (k) => { delete storageMap[k]; }
    };

    // User logged a local food that cloud does not have yet
    const localFood = { id: 'food-local-123', name: 'Sopa de Papa Seca', calories: 420 };
    storageMap[`aurafit_foods_andres`] = JSON.stringify([localFood]);

    // Cloud has an older item
    const cloudFood = { id: 'food-cloud-456', name: 'Pollo a la Plancha', calories: 350 };
    mergeCloudIntoLocalStorage({
      aurafit_foods_andres: [cloudFood]
    });

    const mergedFoods = JSON.parse(storageMap[`aurafit_foods_andres`]);
    assert.strictEqual(mergedFoods.length, 2, 'Both local and cloud food items should be present');
    assert.ok(mergedFoods.some((f) => f.id === 'food-local-123'), 'Locally logged food must not be lost');
    assert.ok(mergedFoods.some((f) => f.id === 'food-cloud-456'), 'Cloud food should be integrated');

    // Local habit marked done
    const localHabits = [{ id: 'creatine', name: 'Creatina', completed: true, time: '09:30' }];
    storageMap[`aurafit_habits_andres`] = JSON.stringify(localHabits);

    // Cloud has uncompleted habit
    const cloudHabits = [{ id: 'creatine', name: 'Creatina', completed: false, time: null }];
    mergeCloudIntoLocalStorage({
      aurafit_habits_andres: cloudHabits
    });

    const mergedHabits = JSON.parse(storageMap[`aurafit_habits_andres`]);
    assert.strictEqual(mergedHabits[0].completed, true, 'Completed habit should not be uncompleted by cloud sync');
  });
});
