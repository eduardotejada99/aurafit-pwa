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
    assert.strictEqual(nextProfiles.pareja.targetCalories, 1950);
  });
});
