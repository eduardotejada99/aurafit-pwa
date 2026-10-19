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

  it('should personalize workout prescription strictly for Anicka (Hermana) with zero calisthenics or heavy strain', () => {
    const anickaPrescription = getHybridWorkoutPrescription({
      profile: FAMILY_PROFILES.hermana,
      sleepHours: 7.5,
      sleepQuality: 'deep',
      recentHeavyDays: 0,
      context: 'gym',
      durationMode: 'full'
    });

    assert.equal(anickaPrescription.profileId, 'hermana');
    assert.equal(anickaPrescription.intensityMode, 'Vitalidad & Ritmo Amable');
    
    // Skill tree must be Anicka's gentle vitality tree, NOT calisthenics
    assert.ok(anickaPrescription.skillTree.vitality_walk, 'Must have vitality walk');
    assert.ok(anickaPrescription.skillTree.gentle_flexibility, 'Must have gentle flexibility');
    assert.ok(anickaPrescription.skillTree.calm_rest, 'Must have calm rest');
    assert.ok(!anickaPrescription.skillTree.handstand, 'Anicka must NOT have handstand');
    assert.ok(!anickaPrescription.skillTree.muscle_up, 'Anicka must NOT have muscle-up');
    assert.ok(!anickaPrescription.skillTree.planche, 'Anicka must NOT have planche');

    // Exercise blocks must be gentle
    anickaPrescription.blocks.forEach((block) => {
      block.exercises.forEach((ex) => {
        assert.ok(!ex.name.toLowerCase().includes('muscle-up'));
        assert.ok(!ex.name.toLowerCase().includes('handstand'));
        assert.ok(!ex.name.toLowerCase().includes('pesado'));
      });
    });
  });

  it('should provide distinct skill trees for all 3 profiles', () => {
    const andresTree = HYBRID_ATHLETE_SYSTEM.skillTrees.andres;
    const parejaTree = HYBRID_ATHLETE_SYSTEM.skillTrees.pareja;
    const hermanaTree = HYBRID_ATHLETE_SYSTEM.skillTrees.hermana;

    assert.ok(andresTree.handstand && andresTree.front_lever && andresTree.muscle_up && andresTree.planche);
    assert.ok(parejaTree.hip_thrust && parejaTree.mcgill_core && parejaTree.supported_row);
    assert.ok(hermanaTree.vitality_walk && hermanaTree.gentle_flexibility && hermanaTree.calm_rest);
  });

  it('should prescribe gentle calm break for Anicka on missed days instead of heavy planks', () => {
    const anickaMissed = getHybridWorkoutPrescription({
      profile: FAMILY_PROFILES.hermana,
      isMissedDay: true
    });

    assert.equal(anickaMissed.selectedSplit, 'calm_break');
    assert.ok(anickaMissed.routineTitle.toLowerCase().includes('calma') || anickaMissed.routineTitle.toLowerCase().includes('descompresión'));
  });

  it('should prescribe intermediate weighted calisthenics for Andres in home_bars context', () => {
    const andresBars = getHybridWorkoutPrescription({
      profile: FAMILY_PROFILES.andres,
      context: 'home_bars'
    });

    assert.ok(andresBars.routineTitle.toLowerCase().includes('calistenia intermedia con lastre'));
    assert.ok(andresBars.exercises.some(e => e.name.toLowerCase().includes('lastre')));
    assert.ok(andresBars.exercises.some(e => e.name.toLowerCase().includes('dominadas')));
    assert.ok(andresBars.exercises.some(e => e.name.toLowerCase().includes('fondos')));
    assert.ok(andresBars.exercises.some(e => e.name.toLowerCase().includes('muscle-up')));
    assert.ok(andresBars.skillTree.weighted_calisthenics, 'Andres skill tree should include weighted_calisthenics');
    assert.ok(andresBars.skillTree.weighted_calisthenics.levels.length >= 4);
  });

  it('should strictly exclude hip thrust from all of Tania routines and splits for lumbar protection', () => {
    const parejaDefault = getHybridWorkoutPrescription({
      profile: FAMILY_PROFILES.pareja,
      context: 'gym'
    });

    // Check all exercises in default prescription
    parejaDefault.exercises.forEach(ex => {
      assert.ok(!ex.name.toLowerCase().includes('hip thrust'), `Exercise ${ex.name} must not be Hip Thrust`);
    });

    // Verify floor bridge with bands is prescribed instead
    assert.ok(parejaDefault.exercises.some(e => e.name.toLowerCase().includes('puente de glúteos en suelo')));

    // Verify McGill Big 3 for lumbar core in dedicated core split and routine
    const parejaCore = getHybridWorkoutPrescription({
      profile: FAMILY_PROFILES.pareja,
      selectedSplit: 'core'
    });
    assert.ok(parejaCore.exercises.some(e => e.name.toLowerCase().includes('mcgill') || e.name.toLowerCase().includes('bird-dog')));

    // Verify all splits of Tania exclude Hip Thrust
    Object.entries(HYBRID_ATHLETE_SYSTEM.splits.pareja).forEach(([sKey, sObj]) => {
      (sObj.blocks || []).forEach(b => {
        (b.exercises || []).forEach(ex => {
          assert.ok(!ex.name.toLowerCase().includes('hip thrust'), `Split ${sKey} has forbidden hip thrust: ${ex.name}`);
        });
      });
    });
  });

  it('should provide dynamic isolated muscle group splits for Tania with pure focus', () => {
    const splits = HYBRID_ATHLETE_SYSTEM.splits.pareja;
    assert.ok(splits.glutes_legs, 'Tania must have Glúteo Aislado');
    assert.ok(splits.piernas, 'Tania must have Piernas aisladas');
    assert.ok(splits.espalda, 'Tania must have Espalda aislada');
    assert.ok(splits.pecho, 'Tania must have Pecho / Tren Superior aislado');
    assert.ok(splits.core, 'Tania must have Core & Blindaje Lumbar aislado');

    // Verify Piernas is pure legs: NO pull/back exercises (jalones, remos, dominadas, pullover)
    const piernasRx = getHybridWorkoutPrescription({ profile: FAMILY_PROFILES.pareja, selectedSplit: 'piernas' });
    piernasRx.exercises.forEach(ex => {
      assert.ok(!ex.name.toLowerCase().includes('jalón'), `Piernas should not include pull: ${ex.name}`);
      assert.ok(!ex.name.toLowerCase().includes('remo'), `Piernas should not include row: ${ex.name}`);
      assert.ok(!ex.name.toLowerCase().includes('dominada'), `Piernas should not include chin/pullup: ${ex.name}`);
      assert.ok(!ex.name.toLowerCase().includes('pullover'), `Piernas should not include pullover: ${ex.name}`);
    });

    // Verify Espalda is pure back: NO quads or leg presses
    const espaldaRx = getHybridWorkoutPrescription({ profile: FAMILY_PROFILES.pareja, selectedSplit: 'espalda' });
    espaldaRx.exercises.forEach(ex => {
      assert.ok(!ex.name.toLowerCase().includes('prensa'), `Espalda should not include leg press: ${ex.name}`);
      assert.ok(!ex.name.toLowerCase().includes('sentadilla'), `Espalda should not include squat: ${ex.name}`);
      assert.ok(!ex.name.toLowerCase().includes('cuádriceps'), `Espalda should not include quads: ${ex.name}`);
    });
  });

  it('should provide dynamic isolated muscle group splits for Andrés with pure focus', () => {
    const splits = HYBRID_ATHLETE_SYSTEM.splits.andres;
    assert.ok(splits.legs, 'Andres must have Piernas pesado');
    assert.ok(splits.push, 'Andres must have Pecho & Empuje con lastre');
    assert.ok(splits.pull, 'Andres must have Espalda & Tracción con lastre');
    assert.ok(splits.glutes, 'Andres must have Glúteo pesado');
    assert.ok(splits.core, 'Andres must have Core & Calistenia estática');

    // Verify Legs is pure legs: NO pull/back exercises
    const legsRx = getHybridWorkoutPrescription({ profile: FAMILY_PROFILES.andres, selectedSplit: 'legs' });
    legsRx.exercises.forEach(ex => {
      assert.ok(!ex.name.toLowerCase().includes('dominadas'), `Legs should not include pullups: ${ex.name}`);
      assert.ok(!ex.name.toLowerCase().includes('remo'), `Legs should not include rows: ${ex.name}`);
      assert.ok(!ex.name.toLowerCase().includes('front lever'), `Legs should not include front lever: ${ex.name}`);
    });

    // Verify Pull is pure back: NO legs exercises
    const pullRx = getHybridWorkoutPrescription({ profile: FAMILY_PROFILES.andres, selectedSplit: 'pull' });
    pullRx.exercises.forEach(ex => {
      assert.ok(!ex.name.toLowerCase().includes('prensa'), `Pull should not include leg press: ${ex.name}`);
      assert.ok(!ex.name.toLowerCase().includes('sentadilla'), `Pull should not include squat: ${ex.name}`);
      assert.ok(!ex.name.toLowerCase().includes('búlgara'), `Pull should not include bulgarian split squat: ${ex.name}`);
    });
  });
});

