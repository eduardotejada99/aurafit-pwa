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
    assert.ok(ids.includes('peru-sopa-moron'), 'Should contain sopa de moron');
    assert.ok(ids.includes('peru-sopa-moron-entrada'), 'Should contain sopa de moron entrada');
    assert.ok(ids.includes('peru-moron-cocido-guarnicion'), 'Should contain moron cocido');
    assert.ok(ids.includes('peru-caldo-gallina'), 'Should contain caldo de gallina');
    assert.ok(ids.includes('peru-shambar'), 'Should contain shambar');
    assert.ok(ids.includes('peru-caldo-verde'), 'Should contain caldo verde cajamarquino');
    assert.ok(ids.includes('peru-patasca'), 'Should contain patasca andina');
    assert.ok(ids.includes('peru-menestron'), 'Should contain menestron criollo');
    // Green juice variants
    assert.ok(ids.includes('fit-jugo-verde-proteico'), 'Should contain protein green juice');
    assert.ok(ids.includes('fit-jugo-verde-termogenico'), 'Should contain thermogenic green juice');
    assert.ok(ids.includes('fit-jugo-verde-andino'), 'Should contain andean green juice');
    assert.ok(ids.includes('fit-jugo-verde-chia-saciante'), 'Should contain chia green juice');
    // Cajamarca and Andean fitness staples
    assert.ok(ids.includes('fit-ceviche-chocho-cajamarca'), 'Should contain ceviche de chocho/tarwi');
    assert.ok(ids.includes('fit-tarwi-chocho-cocido'), 'Should contain tarwi cocido puro');
    assert.ok(ids.includes('fit-quesillo-cajamarquino'), 'Should contain quesillo cajamarquino');
    assert.ok(ids.includes('fit-trucha-plancha-andina'), 'Should contain trucha andina a la plancha');
    assert.ok(ids.includes('fit-mote-sancochado'), 'Should contain mote sancochado');
    assert.ok(ids.includes('fit-cancha-serrana-sin-aceite'), 'Should contain cancha serrana sin aceite');
    assert.ok(ids.includes('fit-choclo-con-quesillo'), 'Should contain choclo con quesillo');
    assert.ok(ids.includes('fit-quinua-cocida'), 'Should contain quinua cocida');
    assert.ok(ids.includes('fit-batido-avena-maca'), 'Should contain batido de maca y avena');
    // Diverse Peruvian & Andean Fitness Proteins
    assert.ok(ids.includes('prot-pechuga-pavo'), 'Should contain pechuga de pavo');
    assert.ok(ids.includes('prot-lechon-horno-magro'), 'Should contain lechon asado magro');
    assert.ok(ids.includes('prot-cuy-asado-andino'), 'Should contain cuy andino asado');
    assert.ok(ids.includes('prot-bonito-plancha'), 'Should contain filete de bonito');
    assert.ok(ids.includes('prot-pota-plancha'), 'Should contain pota cocida/plancha');
    assert.ok(ids.includes('prot-sangrecita-preparada'), 'Should contain sangrecita preparada');
    assert.ok(ids.includes('prot-higado-res-plancha'), 'Should contain higado de res');
    assert.ok(ids.includes('prot-huevos-duros-2unidades'), 'Should contain huevos duros');
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

    // 5. Sopa de Morón (accent tolerant & user query 'acabo de comer moron')
    const parsedMoron = parseNaturalLanguageFood('acabo de comer moron');
    assert.ok(parsedMoron.length > 0, 'Should parse moron without accent');
    assert.ok(parsedMoron[0].name.toLowerCase().includes('morón') || parsedMoron[0].name.toLowerCase().includes('moron'));
    assert.equal(parsedMoron[0].calories, 260);
    assert.equal(parsedMoron[0].protein, 15.0);

    // 6. Sopa de Morón with grams
    const parsedMoronGrams = parseNaturalLanguageFood('300g moron');
    assert.ok(parsedMoronGrams.length > 0, 'Should parse 300g moron');
    assert.equal(parsedMoronGrams[0].grams, 300);
    assert.equal(parsedMoronGrams[0].calories, 225); // 3 * 75 kcal

    // 7. Ceviche de Chocho / Tarwi Cajamarquino
    const parsedChocho = parseNaturalLanguageFood('1 plato de ceviche de chocho');
    assert.ok(parsedChocho.length > 0, 'Should parse ceviche de chocho');
    assert.ok(parsedChocho[0].name.toLowerCase().includes('chocho') || parsedChocho[0].name.toLowerCase().includes('tarwi'));
    assert.equal(parsedChocho[0].protein, 22.0);

    // 8. Quesillo Cajamarquino
    const parsedQuesillo = parseNaturalLanguageFood('1 porcion de quesillo cajamarquino');
    assert.ok(parsedQuesillo.length > 0, 'Should parse quesillo cajamarquino');
    assert.ok(parsedQuesillo[0].name.toLowerCase().includes('quesillo'));

    // 9. Jugo verde proteico
    const parsedGreenProtein = parseNaturalLanguageFood('1 vaso de jugo verde proteico');
    assert.ok(parsedGreenProtein.length > 0, 'Should parse protein green juice');
    assert.equal(parsedGreenProtein[0].protein, 24.0);

    // 10. Pavo (gram scale & default)
    const parsedPavoGrams = parseNaturalLanguageFood('200g pavo');
    assert.ok(parsedPavoGrams.length > 0, 'Should parse 200g pavo');
    assert.equal(parsedPavoGrams[0].grams, 200);
    assert.ok(parsedPavoGrams[0].protein > 40);

    // 11. Lechón al horno
    const parsedLechon = parseNaturalLanguageFood('150g lechon');
    assert.ok(parsedLechon.length > 0, 'Should parse lechón');
    assert.ok(parsedLechon[0].name.toLowerCase().includes('lechon') || parsedLechon[0].name.toLowerCase().includes('lechón'));
    assert.equal(parsedLechon[0].grams, 150);

    // 12. Cuy asado andino
    const parsedCuy = parseNaturalLanguageFood('1 presa de cuy asado');
    assert.ok(parsedCuy.length > 0, 'Should parse cuy asado');
    assert.ok(parsedCuy[0].name.toLowerCase().includes('cuy'));

    // 13. Filete de bonito (Omega-3)
    const parsedBonito = parseNaturalLanguageFood('1 filete de bonito');
    assert.ok(parsedBonito.length > 0, 'Should parse bonito');
    assert.ok(parsedBonito[0].name.toLowerCase().includes('bonito'));

    // 14. Pota a la plancha
    const parsedPota = parseNaturalLanguageFood('180g pota');
    assert.ok(parsedPota.length > 0, 'Should parse pota');
    assert.equal(parsedPota[0].grams, 180);

    // 15. Sangrecita de pollo
    const parsedSangrecita = parseNaturalLanguageFood('1 porcion de sangrecita');
    assert.ok(parsedSangrecita.length > 0, 'Should parse sangrecita');
    assert.ok(parsedSangrecita[0].name.toLowerCase().includes('sangrecita'));

    // 16. Hígado de res
    const parsedHigado = parseNaturalLanguageFood('150g higado de res');
    assert.ok(parsedHigado.length > 0, 'Should parse higado');
    assert.equal(parsedHigado[0].grams, 150);
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

  it('should parse gram-aware multi-clause queries proportionally and accurately', () => {
    // 1. User screenshot query: "30 gr carne molida con 50 gr de lenteja"
    const parsedUserQuery = parseNaturalLanguageFood('30 gr carne molida con 50 gr de lenteja');
    assert.equal(parsedUserQuery.length, 2, 'Must detect both carne molida and lentejas');

    const carne = parsedUserQuery[0];
    assert.ok(carne.name.includes('Carne Molida'));
    assert.ok(carne.name.includes('30g'));
    assert.equal(carne.grams, 30);
    assert.equal(carne.calories, 65); // 30g * 2.15 = 64.5 -> 65 kcal
    assert.equal(carne.protein, 6.3); // 30g * 0.21 = 6.3g
    assert.equal(carne.carbs, 0.0);
    assert.equal(carne.fat, 4.2); // 30g * 0.14 = 4.2g

    const lentejas = parsedUserQuery[1];
    assert.ok(lentejas.name.includes('Lentejas'));
    assert.ok(lentejas.name.includes('50g'));
    assert.equal(lentejas.grams, 50);
    assert.equal(lentejas.calories, 57); // 50g * 1.14 = 57 kcal
    assert.equal(lentejas.protein, 4.0); // 50g * 0.08 = 4.0g
    assert.equal(lentejas.carbs, 9.3); // 50g * 0.187 = 9.35 -> 9.3g
    assert.equal(lentejas.fat, 0.5);

    // Total combination
    const totalCalories = carne.calories + lentejas.calories;
    const totalProtein = carne.protein + lentejas.protein;
    assert.equal(totalCalories, 122);
    assert.equal(parseFloat(totalProtein.toFixed(1)), 10.3);

    // 2. Another common combo: "120g de pechuga con 100g de arroz"
    const parsedChickenRice = parseNaturalLanguageFood('120g de pechuga con 100g de arroz');
    assert.equal(parsedChickenRice.length, 2);
    assert.ok(parsedChickenRice[0].name.includes('Pechuga'));
    assert.equal(parsedChickenRice[0].grams, 120);
    assert.equal(parsedChickenRice[0].calories, 198); // 120 * 1.65 = 198
    assert.ok(parsedChickenRice[1].name.includes('Arroz'));
    assert.equal(parsedChickenRice[1].grams, 100);
    assert.equal(parsedChickenRice[1].calories, 130);
  });
});

