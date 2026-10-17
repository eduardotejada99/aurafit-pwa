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
    });
  });
});
