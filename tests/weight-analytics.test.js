import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateWeightAnalytics } from '../src/lib/fitness-data.js';

describe('AuraFit Weight Moving Average Analytics', () => {
  it('should calculate 7-day rolling average correctly', () => {
    const logs = [
      { log_date: '2026-10-10', weight_kg: 72.0 },
      { log_date: '2026-10-11', weight_kg: 72.2 },
      { log_date: '2026-10-12', weight_kg: 72.4 },
      { log_date: '2026-10-13', weight_kg: 72.6 },
      { log_date: '2026-10-14', weight_kg: 72.8 },
      { log_date: '2026-10-15', weight_kg: 73.0 },
      { log_date: '2026-10-16', weight_kg: 73.2 }
    ];

    const analytics = calculateWeightAnalytics(logs);
    // Average: (72.0+72.2+72.4+72.6+72.8+73.0+73.2)/7 = 508.2 / 7 = 72.6
    assert.equal(analytics.movingAverage, 72.6);
    assert.equal(analytics.currentWeight, 73.2);
    assert.equal(analytics.logsCount, 7);
  });

  it('should flag weekly rate as on-track if within +0.15 to +0.60 kg/week', () => {
    const logs = [
      { log_date: '2026-10-01', weight_kg: 72.0 },
      { log_date: '2026-10-08', weight_kg: 72.35 }
    ];
    const analytics = calculateWeightAnalytics(logs);
    assert.ok(analytics.isOnTrack);
  });
});
