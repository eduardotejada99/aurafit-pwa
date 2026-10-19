import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CURATED_PERUVIAN_FOODS,
  PERUVIAN_MENU_OPTIONS,
  calculatePeruvianCustomMenu,
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

  it('should decouple from Andres and allow pairing any two arbitrary profiles with dynamic serving ratios', () => {
    const meal = {
      id: 'meal-test-pollo',
      name: 'Pechuga a la Plancha con Quinua',
      calories: 400,
      protein: 40,
      carbs: 40,
      fat: 10
    };

    const profile1 = { id: 'prof_tania', name: 'Tania', weightKg: 58, targetCalories: 1800, avatar: '🌸' };
    const profile2 = { id: 'prof_anicka', name: 'Anicka', weightKg: 62, targetCalories: 1600, avatar: '🌿' };

    const couple = calculateCouplePortions(meal, profile1, profile2);
    assert.ok(couple);
    assert.equal(couple.user1.profileName, 'Tania');
    assert.equal(couple.user2.profileName, 'Anicka');
    assert.ok(couple.user1.servingRatio);
    assert.ok(couple.user2.servingRatio);
    assert.ok(couple.batchCookingTip.includes('Tania'));
    assert.ok(couple.batchCookingTip.includes('Anicka'));
    assert.ok(!couple.batchCookingTip.includes('Andrés'));

    // Dynamic grocery list between Tania and Anicka
    const grocery = generateCoupleGroceryList(7, 'Anicka', 'Tania');
    const eggItem = grocery[0].items.find((i) => i.id === 'eggs');
    assert.ok(eggItem.purpose.includes('Tania'));
    assert.ok(eggItem.purpose.includes('Anicka'));
    assert.ok(!eggItem.purpose.includes('Andrés'));
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

  it('should include authentic Peruvian Menús del Día with realistic restaurant portions', () => {
    assert.ok(PERUVIAN_MENU_OPTIONS.length >= 10, 'Should have at least 10 Peruvian menu options');
    const ids = PERUVIAN_MENU_OPTIONS.map((m) => m.id);

    assert.ok(ids.includes('menu-sopa-papaseca-pollo-lenteja-camote'), 'Must have user exact menu: Sopa papa seca + pollo + lenteja + camote');
    assert.ok(ids.includes('menu-pollo-plancha-arroz-papas'), 'Must have Pollo a la plancha menu');
    assert.ok(ids.includes('menu-guiso-pollo-lentejas-arroz'), 'Must have Guiso de pollo con lentejas');
    assert.ok(ids.includes('menu-aji-gallina-arroz-papa'), 'Must have Aji de gallina menu');
    assert.ok(ids.includes('menu-seco-pollo-frejoles-arroz'), 'Must have Seco de pollo menu');
    assert.ok(ids.includes('menu-estofado-pollo-arroz-papa'), 'Must have Estofado de pollo menu');

    // Verify Sopa de Papa Seca menu matches user exact lunch
    const userMenu = PERUVIAN_MENU_OPTIONS.find((m) => m.id === 'menu-sopa-papaseca-pollo-lenteja-camote');
    assert.equal(userMenu.calories, 660);
    assert.equal(userMenu.protein, 53.0);
    assert.equal(userMenu.carbs, 82.0);
    assert.equal(userMenu.fat, 12.0);
    assert.ok(userMenu.breakdown.includes('Sopa de papa seca'));
  });

  it('should parse natural language queries for complete Peruvian menus with 1-click zero friction', () => {
    // 1. User exact lunch: Sopa de papa seca con lenteja, camote y pollo
    const parsedUserLunch = parseNaturalLanguageFood('sopa de papa seca con lenteja, camote y pollo');
    assert.equal(parsedUserLunch.length, 1);
    assert.equal(parsedUserLunch[0].id, 'menu-sopa-papaseca-pollo-lenteja-camote');
    assert.equal(parsedUserLunch[0].calories, 660);
    assert.equal(parsedUserLunch[0].protein, 53.0);

    // 2. Pollo a la plancha del menú
    const parsedPlancha = parseNaturalLanguageFood('pollo a la plancha con arroz y papas');
    assert.equal(parsedPlancha.length, 1);
    assert.equal(parsedPlancha[0].id, 'menu-pollo-plancha-arroz-papas');
    assert.equal(parsedPlancha[0].protein, 53.0);

    // 3. Ají de gallina
    const parsedAji = parseNaturalLanguageFood('menu aji de gallina');
    assert.equal(parsedAji.length, 1);
    assert.equal(parsedAji[0].id, 'menu-aji-gallina-arroz-papa');

    // 4. Guiso de pollo con lentejas
    const parsedGuiso = parseNaturalLanguageFood('guiso de pollo con lentejas y arroz');
    assert.equal(parsedGuiso.length, 1);
    assert.equal(parsedGuiso[0].id, 'menu-guiso-pollo-lentejas-arroz');
  });

  it('should calculate custom Peruvian menu in 3 taps with accurate macros', () => {
    const custom = calculatePeruvianCustomMenu({
      entradaId: 'sopa_papa_seca',
      segundoId: 'guiso_pollo',
      carboIds: ['lentejas', 'camote']
    });

    assert.ok(custom.name.includes('Sopa de Papa Seca'));
    assert.ok(custom.name.includes('Guiso de Pollo'));
    assert.ok(custom.name.includes('Lentejas'));
    assert.ok(custom.name.includes('Camote'));

    // Exact sums: Sopa (160) + Guiso (230) + Lentejas (170) + Camote (120) = 680 kcal
    assert.equal(custom.calories, 680);
    assert.equal(custom.protein, 53.0);
    assert.equal(custom.carbs, 88.0);
    assert.equal(custom.fat, 14.0);
    assert.ok(custom.breakdown.includes('Sopa de Papa Seca'));
  });
});
