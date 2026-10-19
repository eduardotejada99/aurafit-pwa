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
      assert.ok(meal.calories > 300, `${meal.name} has low calories`);
      assert.ok(meal.proteinG >= 20, `${meal.name} should have >= 20g protein`);
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
