import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DAMAGE_CONTROL_PROTOCOL } from '../src/lib/fitness-data.js';

describe('AuraFit Damage Control Protocol', () => {
  it('should have 4 sequential science-backed mitigation steps', () => {
    assert.equal(DAMAGE_CONTROL_PROTOCOL.steps.length, 4);
  });

  it('step 1 must activate GLUT-4 through post-prandial walk', () => {
    const step1 = DAMAGE_CONTROL_PROTOCOL.steps[0];
    assert.ok(step1.title.includes('Caminata'));
    assert.ok(step1.science.includes('GLUT-4'));
    assert.equal(step1.duration, '15 - 20 minutos');
  });

  it('step 2 must provide osmotic hydration with electrolytes', () => {
    const step2 = DAMAGE_CONTROL_PROTOCOL.steps[1];
    assert.ok(step2.title.includes('Hidratación'));
    assert.ok(step2.action.includes('sal mineral'));
  });

  it('step 3 must enforce high-protein/fiber pivot without fasting', () => {
    const step3 = DAMAGE_CONTROL_PROTOCOL.steps[2];
    assert.ok(step3.action.includes('NO ayunes'));
    assert.ok(step3.science.includes('PYY y GLP-1'));
  });

  it('step 4 must safeguard sleep hygiene and nocturnal digestion', () => {
    const step4 = DAMAGE_CONTROL_PROTOCOL.steps[3];
    assert.ok(step4.title.includes('Digestiva'));
    assert.ok(step4.science.includes('sueño de ondas lentas'));
  });
});
