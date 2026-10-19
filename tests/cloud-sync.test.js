import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  SYNC_KEYS,
  getLocalSyncBundle,
  mergeCloudIntoLocalStorage
} from '../src/lib/cloud-sync.js';

describe('AuraFit Multi-Device Cloud Sync Engine', () => {
  // Mock localStorage for Node test environment
  const mockStorage = {};
  global.window = {
    localStorage: {
      getItem: (key) => mockStorage[key] || null,
      setItem: (key, val) => { mockStorage[key] = String(val); },
      removeItem: (key) => { delete mockStorage[key]; },
      clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
    }
  };
  global.localStorage = global.window.localStorage;

  beforeEach(() => {
    global.window.localStorage.clear();
  });

  test('should gather complete local sync bundle from localStorage', () => {
    mockStorage[SYNC_KEYS.FAMILY_PROFILES] = JSON.stringify({
      andres: { name: 'Andrés', weightKg: 74.5 },
      pareja: { name: 'Pareja', weightKg: 58 },
      anicka: { name: 'Anicka', weightKg: 52 }
    });
    mockStorage[SYNC_KEYS.COUPLE_MODE] = 'true';
    mockStorage[SYNC_KEYS.INGREDIENTS] = JSON.stringify(['Avena', 'Huevos', 'Espinaca']);
    mockStorage['aurafit_foods_andres'] = JSON.stringify([{ id: '1', name: 'Tamal de Pollo', calories: 280 }]);

    const bundle = getLocalSyncBundle(['andres', 'pareja', 'anicka']);

    assert.strictEqual(bundle[SYNC_KEYS.COUPLE_MODE], true);
    assert.deepStrictEqual(bundle[SYNC_KEYS.INGREDIENTS], ['Avena', 'Huevos', 'Espinaca']);
    assert.strictEqual(bundle['aurafit_foods_andres'].length, 1);
    assert.strictEqual(bundle['aurafit_foods_andres'][0].name, 'Tamal de Pollo');
    assert.strictEqual(bundle[SYNC_KEYS.FAMILY_PROFILES].andres.weightKg, 74.5);
  });

  test('should merge cloud items safely into localStorage without corruption', () => {
    const cloudItems = {
      [SYNC_KEYS.FAMILY_PROFILES]: {
        andres: { name: 'Andrés Tejada', weightKg: 75 },
        pareja: { name: 'Pareja', weightKg: 58.5 }
      },
      [SYNC_KEYS.COUPLE_MODE]: true,
      [SYNC_KEYS.INGREDIENTS]: ['Avena', 'Humitas Peruanas', 'Jugo Verde'],
      'aurafit_foods_andres': [
        { id: '101', name: 'Jugo Verde Energizante Biohacking', calories: 95 }
      ]
    };

    const result = mergeCloudIntoLocalStorage(cloudItems);

    assert.ok(result.updatedKeys.includes(SYNC_KEYS.FAMILY_PROFILES));
    assert.ok(result.updatedKeys.includes(SYNC_KEYS.COUPLE_MODE));
    assert.ok(result.updatedKeys.includes(SYNC_KEYS.INGREDIENTS));
    assert.ok(result.updatedKeys.includes('aurafit_foods_andres'));

    const storedFoods = JSON.parse(mockStorage['aurafit_foods_andres']);
    assert.strictEqual(storedFoods[0].name, 'Jugo Verde Energizante Biohacking');
  });

  test('should ignore undefined or null items during cloud merge', () => {
    mockStorage['aurafit_foods_andres'] = JSON.stringify([{ id: '1', name: 'Papa a la Huancaína' }]);

    const result = mergeCloudIntoLocalStorage({
      'aurafit_foods_andres': null,
      'unknown_key': undefined
    });

    assert.strictEqual(result.updatedKeys.length, 0);
    const existing = JSON.parse(mockStorage['aurafit_foods_andres']);
    assert.strictEqual(existing[0].name, 'Papa a la Huancaína');
  });
});
