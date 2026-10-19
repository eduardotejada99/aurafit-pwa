import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateMealsFromPantry, PANTRY_DATABASE } from '../src/lib/fitness-data.js';

describe('AuraFit Pantry Meal Generator', () => {
  it('should return default suggestions if no ingredients provided', () => {
    const meals = generateMealsFromPantry([]);
    assert.equal(meals.length, 3);
  });

  it('should match and rank recipes based on available ingredients', () => {
    // With eggs and oats, meal-1 (pancake) should rank #1
    const meals = generateMealsFromPantry(['huevos', 'avena', 'platano']);
    assert.ok(meals.length > 0);
    assert.equal(meals[0].id, 'meal-1');
    assert.equal(meals[0].matchRate, 1);
  });

  it('should have valid macronutrient densities for all meals', () => {
    PANTRY_DATABASE.forEach((meal) => {
      if (meal.tags?.includes('biohacking') || meal.tags?.includes('snack') || meal.tags?.includes('peruano') || meal.tags?.includes('tradicional')) {
        assert.ok(meal.calories >= 70, `${meal.name} should have >= 70 calories`);
        assert.ok(meal.proteinG >= 2, `${meal.name} should have >= 2g protein`);
      } else {
        assert.ok(meal.calories > 300, `${meal.name} has low calories`);
        assert.ok(meal.proteinG >= 20, `${meal.name} should have >= 20g protein`);
      }
      assert.ok(meal.prepMinutes <= 15, `${meal.name} should take <= 15 min`);
      assert.ok(meal.portionDidactic && meal.portionDidactic.length > 5, `${meal.name} must have a didactic portion`);
      assert.ok(meal.didacticWhy && meal.didacticWhy.length > 10, `${meal.name} must explain why to eat this`);
      assert.ok(meal.chefTip && meal.chefTip.length > 5, `${meal.name} must have a chef practical tip`);
    });
  });

  it('should filter recipes accurately by meal slot', () => {
    const breakfasts = generateMealsFromPantry(['huevos', 'avena'], 'lean_bulk', 'desayuno');
    assert.ok(breakfasts.length > 0);
    breakfasts.forEach((m) => {
      assert.equal(m.suggestedSlot, 'desayuno');
    });

    const lunches = generateMealsFromPantry(['pollo', 'arroz'], 'lean_bulk', 'comida');
    assert.ok(lunches.length > 0);
    lunches.forEach((m) => {
      assert.equal(m.suggestedSlot, 'comida');
    });

    const dinners = generateMealsFromPantry(['atun', 'huevos'], 'recomposition', 'cena');
    assert.ok(dinners.length > 0);
    dinners.forEach((m) => {
      assert.equal(m.suggestedSlot, 'cena');
    });

    const snacks = generateMealsFromPantry(['platano', 'avena'], 'lean_bulk', 'snack');
    assert.ok(snacks.length > 0);
    snacks.forEach((m) => {
      assert.equal(m.suggestedSlot, 'snack');
    });
  });

  it('should have an expanded pantry library of at least 15 didactic recipes', () => {
    assert.ok(PANTRY_DATABASE.length >= 15, `PANTRY_DATABASE has ${PANTRY_DATABASE.length} recipes, expected >= 15`);
  });
});

describe('AuraFit Couple Kitchen & Shared Grocery Synchronization', () => {
  it('should calculate scaled portions for Andrés (60%) and Pareja (40%) from single recipe', async () => {
    const { calculateCouplePortions, PANTRY_DATABASE } = await import('../src/lib/fitness-data.js');
    const baseMeal = PANTRY_DATABASE[0]; // Pancakes de avena

    const couple = calculateCouplePortions(baseMeal);
    assert.ok(couple);
    assert.equal(couple.mealId, baseMeal.id);

    // Andrés checks
    assert.equal(couple.andres.profileName, 'Andrés');
    assert.equal(couple.andres.servingRatio, '60%');
    assert.ok(couple.andres.calories > baseMeal.calories);
    assert.ok(couple.andres.protein > baseMeal.proteinG);
    assert.equal(couple.andres.multiplier, 1.25);

    // Pareja checks
    assert.equal(couple.pareja.profileName, 'Mi Pareja');
    assert.equal(couple.pareja.servingRatio, '40%');
    assert.ok(couple.pareja.calories < baseMeal.calories);
    assert.ok(couple.pareja.protein < couple.andres.protein);
    assert.equal(couple.pareja.multiplier, 0.85);

    // Batch cooking advice
    assert.ok(couple.batchCookingTip.includes('1 sola'));
    assert.ok(couple.batchCookingTip.includes('60%'));
  });

  it('should generate categorized couple grocery list for 7 days in Cajabamba', async () => {
    const { generateCoupleGroceryList } = await import('../src/lib/fitness-data.js');
    const list = generateCoupleGroceryList(7);

    assert.ok(list.length >= 4, 'Should have at least 4 grocery categories');
    
    // Check protein items
    const proteinCat = list.find((c) => c.category.includes('Proteínas'));
    assert.ok(proteinCat);
    assert.ok(proteinCat.items.some((i) => i.name.includes('Huevos')));
    assert.ok(proteinCat.items.some((i) => i.name.includes('Pollo')));
    assert.ok(proteinCat.items.some((i) => i.name.includes('Atún')));

    // Check carbs items
    const carbsCat = list.find((c) => c.category.includes('Carbohidratos'));
    assert.ok(carbsCat);
    assert.ok(carbsCat.items.some((i) => i.name.includes('Avena')));
    assert.ok(carbsCat.items.some((i) => i.name.includes('Papa') || i.name.includes('Camote')));

    // Check biohacking & altitude items for Cajabamba
    const bioCat = list.find((c) => c.category.includes('Biohacking') || c.category.includes('Altitud'));
    assert.ok(bioCat);
    assert.ok(bioCat.items.some((i) => i.name.includes('Creatina')));
    assert.ok(bioCat.items.some((i) => i.name.includes('Sal Marina')));
  });

  it('should include authentic Peruvian foods and green juice in PANTRY_DATABASE', () => {
    const jugoVerde = PANTRY_DATABASE.find((m) => m.id === 'meal-jugo-verde');
    const humitas = PANTRY_DATABASE.find((m) => m.id === 'meal-humitas-andinas');
    const tamal = PANTRY_DATABASE.find((m) => m.id === 'meal-tamal-criollo');

    assert.ok(jugoVerde, 'Should contain meal-jugo-verde');
    assert.ok(humitas, 'Should contain meal-humitas-andinas');
    assert.ok(tamal, 'Should contain meal-tamal-criollo');

    assert.ok(jugoVerde.name.includes('Jugo Verde'));
    assert.ok(humitas.name.includes('Humitas'));
    assert.ok(tamal.name.includes('Tamal'));
  });
});

