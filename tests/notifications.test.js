import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  DEFAULT_NOTIFICATION_CONFIG,
  evaluateReminders
} from '../src/lib/notifications.js';

describe('AuraFit Notification & Reminder Engine', () => {
  test('should provide sensible defaults for notification config', () => {
    assert.strictEqual(DEFAULT_NOTIFICATION_CONFIG.waterIntervalMinutes, 60);
    assert.strictEqual(DEFAULT_NOTIFICATION_CONFIG.creatineReminderTime, '10:00');
    assert.strictEqual(DEFAULT_NOTIFICATION_CONFIG.enabled, false);
  });

  test('should trigger water reminder when interval has elapsed', () => {
    const config = {
      enabled: true,
      waterIntervalMinutes: 60,
      lastWaterNotified: Date.now() - 65 * 60 * 1000 // 65 mins ago
    };
    const state = { creatineDone: true, waterMl: 1000, waterTargetMl: 3000 };

    const result = evaluateReminders(config, state);
    assert.strictEqual(result.triggerWater, true);
    assert.strictEqual(result.triggerCreatine, false);
  });

  test('should not trigger water reminder if interval has not elapsed yet', () => {
    const config = {
      enabled: true,
      waterIntervalMinutes: 60,
      lastWaterNotified: Date.now() - 30 * 60 * 1000 // only 30 mins ago
    };
    const state = { creatineDone: true, waterMl: 1000, waterTargetMl: 3000 };

    const result = evaluateReminders(config, state);
    assert.strictEqual(result.triggerWater, false);
  });

  test('should not trigger creatine reminder if user already took creatine today', () => {
    const config = {
      enabled: true,
      creatineReminderTime: '08:00',
      lastCreatineNotifiedDate: null
    };
    const state = { creatineDone: true, waterMl: 1000, waterTargetMl: 3000 };

    const result = evaluateReminders(config, state);
    assert.strictEqual(result.triggerCreatine, false);
  });

  test('should trigger creatine reminder if target time is passed and creatine not done', () => {
    const config = {
      enabled: true,
      creatineReminderTime: '00:01', // Set to early time in the past today
      lastCreatineNotifiedDate: '2020-01-01' // Past date
    };
    const state = { creatineDone: false, waterMl: 500, waterTargetMl: 3000 };

    const result = evaluateReminders(config, state);
    assert.strictEqual(result.triggerCreatine, true);
  });

  test('should not trigger any reminders if notifications are disabled in config', () => {
    const config = {
      enabled: false,
      waterIntervalMinutes: 10,
      lastWaterNotified: 0
    };
    const state = { creatineDone: false, waterMl: 0, waterTargetMl: 3000 };

    const result = evaluateReminders(config, state);
    assert.strictEqual(result.triggerWater, false);
    assert.strictEqual(result.triggerCreatine, false);
  });
});
