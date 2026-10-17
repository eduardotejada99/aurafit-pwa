import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WORKOUT_ROUTINES } from '../src/lib/fitness-data.js';

describe('AuraFit Adaptive Workout Engine', () => {
  it('should provide structured Gym progressive overload routine', () => {
    const gym = WORKOUT_ROUTINES.gym;
    assert.ok(gym.exercises.length >= 5);
    gym.exercises.forEach((ex) => {
      assert.ok(ex.name);
      assert.ok(ex.sets >= 3);
      assert.ok(ex.restSeconds >= 60);
    });
  });

  it('should provide high-intensity EMOM 30-min routine for home / travel', () => {
    const home = WORKOUT_ROUTINES.home_emom;
    assert.equal(home.durationMinutes, 30);
    assert.equal(home.exercises.length, 6);
    // Check minute sequence 1 to 6
    home.exercises.forEach((ex, idx) => {
      assert.equal(ex.minute, idx + 1);
    });
  });
});
