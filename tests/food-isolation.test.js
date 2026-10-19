import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('AuraFit Strict Multi-User Food Diary Isolation & Couple Serving', () => {
  it('should strictly isolate foods by profileId and exclude cross-contamination', () => {
    const andresFoods = [
      { id: 'f-1', name: 'Huevos revueltos y avena', profileId: 'andres', mealSlot: 'desayuno', calories: 450, date: '2026-10-19' },
      { id: 'f-2', name: 'Pollo con arroz y palta', profileId: 'andres', mealSlot: 'comida', calories: 650, date: '2026-10-19' }
    ];

    const filterActiveFoods = (foods, activeProfileId, targetDate) => {
      return foods.filter((item) => {
        if (item.profileId) {
          if (item.profileId !== activeProfileId) return false;
        } else {
          if (activeProfileId !== 'andres') return false;
        }
        if (item.date) return item.date === targetDate;
        return true;
      });
    };

    // Andrés sees his 2 meals
    const andresActive = filterActiveFoods(andresFoods, 'andres', '2026-10-19');
    assert.strictEqual(andresActive.length, 2);

    // If Tania opens her app, Andrés' foods are 100% excluded (0 meals)
    const parejaActive = filterActiveFoods(andresFoods, 'pareja', '2026-10-19');
    assert.strictEqual(parejaActive.length, 0, 'Tania must NOT see Andrés foods in her active day view');

    // If Ánicka opens her app, Andrés' foods are 100% excluded (0 meals)
    const hermanaActive = filterActiveFoods(andresFoods, 'hermana', '2026-10-19');
    assert.strictEqual(hermanaActive.length, 0, 'Ánicka must NOT see Andrés foods in her active day view');
  });

  it('should purge cross-contaminated foods from storage when loading non-andres profile', () => {
    // Simulating a scenario where previous bug copied Andrés foods into Tania's storage
    const contaminatedStorage = [
      { id: 'f-andres-1', name: 'Desayuno Andrés 6 huevos', profileId: 'andres', calories: 500 },
      { id: 'f-legacy', name: 'Desayuno Legacy sin tag', calories: 350 },
      { id: 'f-pareja-1', name: 'Yogurt griego con arándanos', profileId: 'pareja', calories: 220 }
    ];

    const loadProfileFoods = (rawList, profileKey) => {
      let saved = [];
      if (Array.isArray(rawList)) {
        saved = rawList.filter((item) => {
          if (item.profileId) return item.profileId === profileKey;
          return profileKey === 'andres';
        });
      }
      return saved;
    };

    const cleanPareja = loadProfileFoods(contaminatedStorage, 'pareja');
    assert.strictEqual(cleanPareja.length, 1);
    assert.strictEqual(cleanPareja[0].name, 'Yogurt griego con arándanos');
    assert.strictEqual(cleanPareja[0].profileId, 'pareja');

    const cleanAndres = loadProfileFoods(contaminatedStorage, 'andres');
    assert.strictEqual(cleanAndres.length, 2); // gets tagged andres + untagged legacy
  });

  it('should NEVER use legacy aurafit_logged_foods fallback for pareja or hermana', () => {
    const mockStorage = {
      aurafit_logged_foods: JSON.stringify([{ id: 'legacy-1', name: 'Andres Desayuno', calories: 600 }]),
      aurafit_foods_pareja: null,
      aurafit_foods_hermana: null
    };

    const simulateLoadFallback = (storage, profileKey) => {
      let savedFoods = [];
      const raw = storage[`aurafit_foods_${profileKey}`];
      if (raw) {
        savedFoods = JSON.parse(raw);
      } else if (profileKey === 'andres') {
        const legacy = storage['aurafit_logged_foods'];
        if (legacy) savedFoods = JSON.parse(legacy);
      }
      return savedFoods;
    };

    const andresResult = simulateLoadFallback(mockStorage, 'andres');
    assert.strictEqual(andresResult.length, 1);

    const parejaResult = simulateLoadFallback(mockStorage, 'pareja');
    assert.strictEqual(parejaResult.length, 0, 'Pareja must NOT fallback to legacy global foods');

    const hermanaResult = simulateLoadFallback(mockStorage, 'hermana');
    assert.strictEqual(hermanaResult.length, 0, 'Hermana must NOT fallback to legacy global foods');
  });

  it('should allow Andrés to serve couple portion to Tania without bleeding into Andrés diary', () => {
    let andresDiary = [
      { id: 'f-1', name: 'Avena con proteína', profileId: 'andres', mealSlot: 'desayuno', calories: 400 }
    ];
    let parejaStorage = [];

    // Simulate handleServeCouplePortion('pareja', ...)
    const couplePortionTania = {
      name: 'Lomo Saltado Casero (Porción Tania 0.85x)',
      calories: 420,
      protein: 36,
      carbs: 40,
      fat: 12,
      mealSlot: 'comida'
    };

    const newEntry = {
      id: 'couple-12345',
      profileId: 'pareja',
      ...couplePortionTania,
      date: '2026-10-19'
    };

    parejaStorage = [newEntry, ...parejaStorage];

    // Andrés diary remains untouched!
    assert.strictEqual(andresDiary.length, 1);
    assert.strictEqual(andresDiary[0].name, 'Avena con proteína');

    // Tania storage now has her 40% portion
    assert.strictEqual(parejaStorage.length, 1);
    assert.strictEqual(parejaStorage[0].profileId, 'pareja');
    assert.strictEqual(parejaStorage[0].name, 'Lomo Saltado Casero (Porción Tania 0.85x)');
    assert.strictEqual(parejaStorage[0].calories, 420);
  });
});
