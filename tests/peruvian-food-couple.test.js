import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CURATED_PERUVIAN_FOODS,
  parseNaturalLanguageFood
} from '../src/lib/food-database.js';
import {
  calculateCouplePortions,
  generateCoupleGroceryList,
  FAMILY_PROFILES,
  HYBRID_ATHLETE_SYSTEM
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

  it('should dynamically link partner name in couple portions and shared grocery list', () => {
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

    // When user updates partner name to Tania (or any custom name)
    const coupleTania = calculateCouplePortions(meal, 'Tania');
    assert.equal(coupleTania.pareja.profileName, 'Tania');
    assert.ok(coupleTania.batchCookingTip.includes('Tania'));
    assert.ok(coupleTania.pareja.portionDidactic.includes('Tania'));

    // When grocery list is generated with partner name
    const grocery = generateCoupleGroceryList(7, 'Tania');
    const eggItem = grocery[0].items.find((i) => i.id === 'eggs');
    assert.ok(eggItem.purpose.includes('Tania'));
  });

  it('should verify Anicka (Hermana) profile identity, metabolic settings, and 7-day wellness cycle', () => {
    const anicka = FAMILY_PROFILES.hermana;
    assert.ok(anicka.name.includes('Anicka'));
    assert.equal(anicka.shortName, 'Anicka');
    assert.equal(anicka.goal, 'insulin_sensitivity');
    assert.equal(anicka.activityLevel, 'light');
    assert.ok(anicka.role.includes('Bienestar') || anicka.role.includes('Movilidad'));

    const anickaSplits = HYBRID_ATHLETE_SYSTEM.splits.hermana;
    assert.ok(anickaSplits.lunes_eden_dance, 'Monday Donna Eden dance routine');
    assert.ok(anickaSplits.martes_walk, 'Tuesday walk routine');
    assert.ok(anickaSplits.miercoles_tapping, 'Wednesday EFT tapping routine');
    assert.ok(anickaSplits.jueves_eden_flow, 'Thursday Donna Eden flow routine');
    assert.ok(anickaSplits.viernes_walk_nature, 'Friday nature walk routine');
    assert.ok(anickaSplits.sabado_hybrid_wellness, 'Saturday hybrid wellness routine');
    assert.ok(anickaSplits.domingo_calm_pause, 'Sunday calm pause routine');

    const anickaSkills = HYBRID_ATHLETE_SYSTEM.skillTrees.hermana;
    assert.ok(anickaSkills.dona_eden_dance, 'Donna Eden skill tree');
    assert.ok(anickaSkills.eft_tapping, 'EFT tapping skill tree');
    assert.ok(anickaSkills.vitality_walk, 'Vitality walk skill tree');
  });
});
