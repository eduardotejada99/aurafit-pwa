import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CURATED_PERUVIAN_FOODS,
  parseNaturalLanguageFood
} from '../src/lib/food-database.js';
import {
  calculateCouplePortions,
  FAMILY_PROFILES
} from '../src/lib/fitness-data.js';

describe('AuraFit Peruvian Foods & Couple Mode Engine', () => {
  it('should include authentic Peruvian foods and green juice in CURATED_PERUVIAN_FOODS', () => {
    const ids = CURATED_PERUVIAN_FOODS.map((f) => f.id);
    assert.ok(ids.includes('fit-jugo-verde-alcalinizante'), 'Should contain green juice');
    assert.ok(ids.includes('peru-humita-dulce'), 'Should contain sweet humita');
    assert.ok(ids.includes('peru-humita-salada'), 'Should contain savory humita');
    assert.ok(ids.includes('peru-tamal-pollo'), 'Should contain chicken tamal');
    assert.ok(ids.includes('peru-tamal-chancho'), 'Should contain pork tamal');
    assert.ok(ids.includes('peru-tamalito-verde'), 'Should contain tamalito verde');
    assert.ok(ids.includes('peru-papa-huancaina'), 'Should contain papa a la huancaina');
    assert.ok(ids.includes('peru-pan-chicharron'), 'Should contain pan con chicharron');
    assert.ok(ids.includes('peru-emoliente-andino'), 'Should contain emoliente');
  });

  it('should parse natural language queries for green juice and Peruvian specialties', () => {
    // 1. Jugo verde
    const parsedJugo = parseNaturalLanguageFood('1 vaso de jugo verde');
    assert.ok(parsedJugo.length > 0, 'Should parse jugo verde');
    assert.ok(parsedJugo[0].name.toLowerCase().includes('jugo verde'));

    // 2. Humita dulce
    const parsedHumita = parseNaturalLanguageFood('2 humitas dulces');
    assert.ok(parsedHumita.length > 0, 'Should parse humitas');
    assert.ok(parsedHumita[0].name.toLowerCase().includes('humita'));

    // 3. Tamal de pollo
    const parsedTamal = parseNaturalLanguageFood('1 tamal de pollo criollo');
    assert.ok(parsedTamal.length > 0, 'Should parse tamal');
    assert.ok(parsedTamal[0].name.toLowerCase().includes('tamal'));

    // 4. Papa a la huancaína
    const parsedHuancaina = parseNaturalLanguageFood('1 porcion de papa a la huancaina');
    assert.ok(parsedHuancaina.length > 0, 'Should parse huancaina');
    assert.ok(parsedHuancaina[0].name.toLowerCase().includes('huanca'));
  });

  it('should correctly calculate couple mode split (60% Andrés, 40% Pareja) for meals', () => {
    const meal = {
      id: 'meal-test-lomo',
      name: 'Lomo Saltado con Arroz',
      calories: 500,
      protein: 40,
      proteinG: 40,
      carbs: 50,
      carbsG: 50,
      fat: 15,
      fatG: 15
    };

    const couple = calculateCouplePortions(meal);
    assert.ok(couple);
    assert.equal(couple.andres.servingRatio, '60%');
    assert.equal(couple.pareja.servingRatio, '40%');
    assert.ok(couple.andres.calories > couple.pareja.calories);
    assert.ok(couple.andres.protein > couple.pareja.protein);
    assert.ok(couple.batchCookingTip.includes('1 sola'));
  });

  it('should verify Anicka (Hermana) profile identity and metabolic settings', () => {
    const anicka = FAMILY_PROFILES.hermana;
    assert.ok(anicka.name.includes('Anicka'));
    assert.equal(anicka.shortName, 'Anicka');
    assert.equal(anicka.goal, 'insulin_sensitivity');
    assert.equal(anicka.activityLevel, 'light');
    assert.ok(anicka.role.includes('Bienestar') || anicka.role.includes('Movilidad'));
  });
});
