import { getLocalDateKey } from './fitness-data.js';

export const SYNC_KEYS = {
  FAMILY_PROFILES: 'aurafit_family_profiles',
  COUPLE_MODE: 'aurafit_couple_mode_enabled',
  INGREDIENTS: 'aurafit_ingredients',
  FOODS_PREFIX: 'aurafit_foods_',
  HABITS_PREFIX: 'aurafit_habits_',
  HABITS_BY_DATE_PREFIX: 'aurafit_habits_by_date_',
  COMPLETED_EXERCISES_BY_DATE_PREFIX: 'aurafit_completed_exercises_by_date_',
  WEIGHTS_PREFIX: 'aurafit_weights_',
  WATER_PREFIX: 'aurafit_water_by_date_',
  SLEEP_PREFIX: 'aurafit_sleep_',
  WORKOUT_PREFIX: 'aurafit_workout_'
};

let syncDebounceTimer = null;
let pendingBundle = {};

/**
 * Queue a key-value update to be synced to the cloud with debouncing
 */
export function queueCloudSync(key, data, profileId = 'device') {
  if (typeof window === 'undefined') return;
  pendingBundle[key] = data;

  if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(() => {
    flushCloudSync(profileId);
  }, 1200);
}

/**
 * Flush all pending queued updates to the server immediately
 */
export async function flushCloudSync(profileId = 'device') {
  if (typeof window === 'undefined') return { ok: false };
  if (Object.keys(pendingBundle).length === 0) return { ok: true, empty: true };

  const bundleToSend = { ...pendingBundle };
  pendingBundle = {};

  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bundle: bundleToSend, updatedBy: profileId })
    });
    const result = await res.json();
    return result;
  } catch (err) {
    console.warn('[CloudSync] Flush error:', err.message);
    // Put back in pending bundle in case of network drop
    pendingBundle = { ...bundleToSend, ...pendingBundle };
    return { ok: false, error: err.message };
  }
}

/**
 * Fetch all synced items from Neon PostgreSQL cloud
 */
export async function pullCloudData(profileId = 'andres') {
  if (typeof window === 'undefined') return { ok: false, items: {} };

  try {
    const res = await fetch(`/api/sync?all=true&profileId=${encodeURIComponent(profileId)}`, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (!res.ok) {
      return { ok: false, items: {} };
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('[CloudSync] Pull error:', err.message);
    return { ok: false, items: {}, error: err.message };
  }
}

/**
 * Gather full local bundle from localStorage to initialize or back up to cloud
 */
export function getLocalSyncBundle(profileKeys = ['andres', 'pareja', 'anicka']) {
  if (typeof window === 'undefined') return {};
  const bundle = {};

  const copyIfPresent = (key) => {
    const val = localStorage.getItem(key);
    if (val !== null) {
      try {
        bundle[key] = JSON.parse(val);
      } catch (e) {
        bundle[key] = val;
      }
    }
  };

  copyIfPresent(SYNC_KEYS.FAMILY_PROFILES);
  copyIfPresent(SYNC_KEYS.COUPLE_MODE);
  copyIfPresent(SYNC_KEYS.INGREDIENTS);

  profileKeys.forEach((k) => {
    copyIfPresent(`${SYNC_KEYS.FOODS_PREFIX}${k}`);
    copyIfPresent(`${SYNC_KEYS.HABITS_PREFIX}${k}`);
    copyIfPresent(`${SYNC_KEYS.HABITS_BY_DATE_PREFIX}${k}`);
    copyIfPresent(`${SYNC_KEYS.COMPLETED_EXERCISES_BY_DATE_PREFIX}${k}`);
    copyIfPresent(`${SYNC_KEYS.WEIGHTS_PREFIX}${k}`);
    copyIfPresent(`${SYNC_KEYS.WATER_PREFIX}${k}`);
    copyIfPresent(`${SYNC_KEYS.SLEEP_PREFIX}${k}`);
    copyIfPresent(`aurafit_sleep_by_date_${k}`);
    copyIfPresent(`${SYNC_KEYS.WORKOUT_PREFIX}${k}`);
    copyIfPresent(`aurafit_workout_week_${k}`);
    copyIfPresent(`aurafit_selected_split_${k}`);
    copyIfPresent(`aurafit_exercise_logs_${k}`);
  });

  return bundle;
}

/**
 * Merge cloud items into local storage safely with monotonic data preservation
 * Prevents offline/stale cloud data from overwriting local non-zero progress
 */
export function mergeCloudIntoLocalStorage(cloudItems = {}) {
  if (typeof window === 'undefined' || !cloudItems) return { updatedKeys: [] };

  const updatedKeys = [];
  const todayKey = getLocalDateKey();

  Object.entries(cloudItems).forEach(([key, val]) => {
    if (val === undefined || val === null) return;

    try {
      const current = localStorage.getItem(key);

      // 1. Water Tracking: Monotonic date-by-date maximum merge (Water never resets to 0 from cloud)
      if (key.startsWith(SYNC_KEYS.WATER_PREFIX)) {
        let localObj = {};
        if (current) {
          try { localObj = JSON.parse(current); } catch (e) {}
        }
        let cloudObj = typeof val === 'object' && val !== null ? val : {};
        if (typeof val === 'string') {
          try { cloudObj = JSON.parse(val); } catch (e) {}
        }

        const mergedWater = { ...localObj };
        Object.keys(cloudObj).forEach((dateKey) => {
          const cloudVal = Number(cloudObj[dateKey]) || 0;
          const localVal = Number(localObj[dateKey]) || 0;
          mergedWater[dateKey] = Math.max(localVal, cloudVal);
        });

        const serialized = JSON.stringify(mergedWater);
        if (current !== serialized) {
          localStorage.setItem(key, serialized);
          updatedKeys.push(key);
        }

        // Also keep daily water key synchronized so today's counter is bulletproof
        const profileId = key.replace(SYNC_KEYS.WATER_PREFIX, '');
        const currentDailyRaw = localStorage.getItem(`aurafit_water_daily_${profileId}`);
        let currentDailyAmount = 0;
        if (currentDailyRaw) {
          try {
            const parsed = JSON.parse(currentDailyRaw);
            if (parsed.date === todayKey) {
              currentDailyAmount = parsed.ml ?? parsed.amount ?? 0;
            }
          } catch (e) {}
        }
        const effectiveTodayWater = Math.max(currentDailyAmount, mergedWater[todayKey] || 0);
        localStorage.setItem(`aurafit_water_daily_${profileId}`, JSON.stringify({ date: todayKey, ml: effectiveTodayWater }));
        localStorage.setItem(`aurafit_water_${profileId}`, effectiveTodayWater.toString());
        return;
      }

      // 2. Logged Foods: Union merge by item.id so recent meals are never lost
      if (key.startsWith(SYNC_KEYS.FOODS_PREFIX)) {
        let localList = [];
        if (current) {
          try { localList = JSON.parse(current); } catch (e) {}
        }
        let cloudList = Array.isArray(val) ? val : [];
        if (typeof val === 'string') {
          try { cloudList = JSON.parse(val); } catch (e) {}
        }

        const foodMap = new Map();
        if (Array.isArray(cloudList)) {
          cloudList.forEach((item) => {
            if (item && item.id) foodMap.set(String(item.id), item);
          });
        }
        if (Array.isArray(localList)) {
          localList.forEach((item) => {
            if (item && item.id) foodMap.set(String(item.id), item);
          });
        }
        const mergedFoods = Array.from(foodMap.values());
        const serialized = JSON.stringify(mergedFoods);
        if (current !== serialized) {
          localStorage.setItem(key, serialized);
          updatedKeys.push(key);
        }
        return;
      }

      // 3. Habits: Preserve completion checks and custom habits across devices
      if (key.startsWith(SYNC_KEYS.HABITS_PREFIX) && !key.startsWith(SYNC_KEYS.HABITS_BY_DATE_PREFIX)) {
        let localHabits = [];
        if (current) {
          try { localHabits = JSON.parse(current); } catch (e) {}
        }
        let cloudHabits = Array.isArray(val) ? val : [];
        if (typeof val === 'string') {
          try { cloudHabits = JSON.parse(val); } catch (e) {}
        }

        const habitMap = new Map();
        if (Array.isArray(cloudHabits)) {
          cloudHabits.forEach((h) => {
            if (h && h.id) habitMap.set(h.id, h);
          });
        }
        if (Array.isArray(localHabits)) {
          localHabits.forEach((lh) => {
            if (lh && lh.id) {
              if (!habitMap.has(lh.id)) {
                habitMap.set(lh.id, lh);
              } else {
                const ch = habitMap.get(lh.id);
                habitMap.set(lh.id, {
                  ...ch,
                  ...lh,
                  completed: Boolean(lh.completed || ch.completed),
                  time: lh.time || ch.time
                });
              }
            }
          });
        }
        const mergedHabits = Array.from(habitMap.values());
        const serialized = JSON.stringify(mergedHabits);
        if (current !== serialized) {
          localStorage.setItem(key, serialized);
          updatedKeys.push(key);
        }
        return;
      }

      // 4. Habits by Date: Monotonic date-by-date dictionary merge
      if (key.startsWith(SYNC_KEYS.HABITS_BY_DATE_PREFIX)) {
        let localMap = {};
        if (current) {
          try { localMap = JSON.parse(current); } catch (e) {}
        }
        let cloudMap = typeof val === 'object' && val !== null ? val : {};
        if (typeof val === 'string') {
          try { cloudMap = JSON.parse(val); } catch (e) {}
        }

        const mergedMap = { ...localMap };
        Object.keys(cloudMap).forEach((dateKey) => {
          mergedMap[dateKey] = {
            ...(localMap[dateKey] || {}),
            ...(cloudMap[dateKey] || {})
          };
        });

        const serialized = JSON.stringify(mergedMap);
        if (current !== serialized) {
          localStorage.setItem(key, serialized);
          updatedKeys.push(key);
        }
        return;
      }

      // 5. Completed Exercises by Date: Union list merge per date
      if (key.startsWith(SYNC_KEYS.COMPLETED_EXERCISES_BY_DATE_PREFIX)) {
        let localMap = {};
        if (current) {
          try { localMap = JSON.parse(current); } catch (e) {}
        }
        let cloudMap = typeof val === 'object' && val !== null ? val : {};
        if (typeof val === 'string') {
          try { cloudMap = JSON.parse(val); } catch (e) {}
        }

        const mergedMap = { ...localMap };
        Object.keys(cloudMap).forEach((dateKey) => {
          const lList = Array.isArray(localMap[dateKey]) ? localMap[dateKey] : [];
          const cList = Array.isArray(cloudMap[dateKey]) ? cloudMap[dateKey] : [];
          mergedMap[dateKey] = Array.from(new Set([...lList, ...cList]));
        });

        const serialized = JSON.stringify(mergedMap);
        if (current !== serialized) {
          localStorage.setItem(key, serialized);
          updatedKeys.push(key);
        }
        return;
      }

      // 6. Default: Safe update
      const serialized = typeof val === 'string' ? val : JSON.stringify(val);
      if (current !== serialized) {
        localStorage.setItem(key, serialized);
        updatedKeys.push(key);
      }
    } catch (e) {
      console.warn('[CloudSync] Error saving item to localStorage:', key, e);
    }
  });

  return { updatedKeys };
}
