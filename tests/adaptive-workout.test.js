import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKOUT_ROUTINES,
  HYBRID_ATHLETE_SYSTEM,
  getHybridWorkoutPrescription,
  FAMILY_PROFILES
} from '../src/lib/fitness-data.js';

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
    home.exercises.forEach((ex, idx) => {
      assert.equal(ex.minute, idx + 1);
    });
  });

  it('should prescribe hybrid athlete 3-block routine for Andrés with high readiness', () => {
    const prescription = getHybridWorkoutPrescription({
      profile: FAMILY_PROFILES.andres,
      sleepHours: 8,
      sleepQuality: 'deep',
      recentHeavyDays: 0,
      context: 'gym',
      durationMode: 'full'
    });

    assert.equal(prescription.profileId, 'andres');
    assert.ok(prescription.readinessScore >= 85);
    assert.equal(prescription.blocks.length, 3);
    assert.ok(prescription.blocks[0].name.includes('Fuerza Pesada'));
    assert.ok(prescription.blocks[1].name.includes('Calistenia'));
    assert.ok(prescription.blocks[2].name.includes('Motor Híbrido'));
  });

  it('should auto-regulate CNS intensity when sleep is deficient (<6.5h)', () => {
    const tiredPrescription = getHybridWorkoutPrescription({
      profile: FAMILY_PROFILES.andres,
      sleepHours: 5.5,
      sleepQuality: 'light',
      recentHeavyDays: 0,
      context: 'gym',
      durationMode: 'full'
    });

    assert.ok(tiredPrescription.readinessScore < 60);
    assert.equal(tiredPrescription.intensityMode, 'Técnica & Descarga Activa');
    assert.ok(tiredPrescription.warnings.some((w) => w.includes('Sueño Corto') || w.includes('SNC')));
    assert.ok(tiredPrescription.recommendations.some((r) => r.includes('Auto-Regulación Activada')));
  });

  it('should recommend Calisthenics skills and Zone 2 when 2+ heavy days are completed', () => {
    const recoveryPrescription = getHybridWorkoutPrescription({
      profile: FAMILY_PROFILES.andres,
      sleepHours: 7.5,
      sleepQuality: 'deep',
      recentHeavyDays: 2,
      context: 'gym',
      durationMode: 'full'
    });

    assert.ok(recoveryPrescription.recommendations.some((r) => 
      r.includes('Tejido Conectivo') && r.includes('Front Lever')
    ));
  });

  it('should provide full 4-skill calisthenics skill tree with progressive levels and cues', () => {
    const tree = HYBRID_ATHLETE_SYSTEM.skillTree;
    assert.ok(tree.handstand);
    assert.ok(tree.front_lever);
    assert.ok(tree.muscle_up);
    assert.ok(tree.planche);

    // Verify handstand levels
    assert.ok(tree.handstand.levels.length >= 3);
    tree.handstand.levels.forEach((lvl) => {
      assert.ok(lvl.title);
      assert.ok(lvl.target);
      assert.ok(lvl.cues);
      assert.ok(lvl.commonMistake);
    });

    // Verify front lever has beginner to master progressions
    assert.ok(tree.front_lever.levels.length >= 4);
    assert.equal(tree.front_lever.levels[0].difficulty, 'Novato');
    assert.equal(tree.front_lever.levels[3].difficulty, 'Master');
  });

  it('should guarantee free-weight and machine substitutes for all gym exercises', () => {
    const andresGym = HYBRID_ATHLETE_SYSTEM.routines.andres.gym;
    andresGym.blocks.forEach((block) => {
      block.exercises.forEach((ex) => {
        assert.ok(ex.substitute, `Exercise ${ex.name} must have a valid substitute for universal gym adaptability`);
      });
    });
  });

  it('should enforce zero axial spinal compression for Pareja routines', () => {
    const parejaGym = HYBRID_ATHLETE_SYSTEM.routines.pareja.gym;
    assert.ok(parejaGym.title.includes('Cero Compresión Axial Lumbar'));
    parejaGym.blocks.forEach((block) => {
      block.exercises.forEach((ex) => {
        // Assert no standing barbell squats or compressive deadlifts
        assert.ok(!ex.name.toLowerCase().includes('sentadilla trasera con barra'));
        assert.ok(!ex.name.toLowerCase().includes('peso muerto convencional'));
        assert.ok(ex.note.includes('espalda') || ex.note.includes('lumbar') || ex.note.includes('columna') || ex.note.includes('glúteo'));
      });
    });
  });

  it('should support home and travel contexts for both Andrés and Pareja', () => {
    assert.ok(HYBRID_ATHLETE_SYSTEM.routines.andres.home_bars);
    assert.ok(HYBRID_ATHLETE_SYSTEM.routines.andres.travel);
    assert.ok(HYBRID_ATHLETE_SYSTEM.routines.pareja.home_bars);
    assert.ok(HYBRID_ATHLETE_SYSTEM.routines.pareja.travel);
  });
});
