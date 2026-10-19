/**
 * AuraFit Cloud Sync Engine (Neon PostgreSQL + Offline-First LocalStorage)
 * Handles bidirectional state synchronization across family devices (Andrés, Pareja, Anicka)
 */

export const SYNC_KEYS = {
  FAMILY_PROFILES: 'aurafit_family_profiles',
  COUPLE_MODE: 'aurafit_couple_mode_enabled',
  INGREDIENTS: 'aurafit_ingredients',
  FOODS_PREFIX: 'aurafit_foods_',
  HABITS_PREFIX: 'aurafit_habits_',
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
    copyIfPresent(`${SYNC_KEYS.WEIGHTS_PREFIX}${k}`);
    copyIfPresent(`${SYNC_KEYS.WATER_PREFIX}${k}`);
    copyIfPresent(`${SYNC_KEYS.SLEEP_PREFIX}${k}`);
    copyIfPresent(`${SYNC_KEYS.WORKOUT_PREFIX}${k}`);
  });

  return bundle;
}

/**
 * Merge cloud items into local storage safely
 */
export function mergeCloudIntoLocalStorage(cloudItems = {}) {
  if (typeof window === 'undefined' || !cloudItems) return { updatedKeys: [] };

  const updatedKeys = [];
  Object.entries(cloudItems).forEach(([key, val]) => {
    if (val === undefined || val === null) return;
    try {
      const serialized = typeof val === 'string' ? val : JSON.stringify(val);
      const current = localStorage.getItem(key);
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
