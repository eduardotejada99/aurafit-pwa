/**
 * AuraFit Smart Notification Engine (Creatine & Water Reminders)
 * Supports Mobile PWA Web Notifications, Service Worker Badging, and Scheduled Background Triggers
 */

import { getLocalDateKey } from './fitness-data.js';

export const DEFAULT_NOTIFICATION_CONFIG = {
  enabled: false,
  waterIntervalMinutes: 60, // 45, 60, 90, 120 or 0 (disabled)
  creatineReminderTime: '10:00', // 24h format HH:mm
  soundEnabled: true,
  lastWaterNotified: null,
  lastCreatineNotifiedDate: null
};

/**
 * Check if Web Notifications are supported in current browser/device
 */
export function checkNotificationSupport() {
  if (typeof window === 'undefined') {
    return { supported: false, permission: 'unsupported' };
  }
  const supported = 'Notification' in window;
  const permission = supported ? Notification.permission : 'unsupported';
  return { supported, permission };
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (err) {
    console.warn('[Notifications] Error requesting permission:', err);
    return 'denied';
  }
}

/**
 * Dispatch a native push/system notification via Service Worker with fallback
 */
export async function triggerLocalNotification({
  title,
  body,
  icon = '/icon-192.png',
  badge = '/favicon.png',
  tag = 'aurafit-alert',
  vibrate = [200, 100, 200],
  data = {}
}) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { sent: false, reason: 'unsupported' };
  }

  if (Notification.permission !== 'granted') {
    return { sent: false, reason: 'not_granted', permission: Notification.permission };
  }

  const options = {
    body,
    icon,
    badge,
    tag,
    vibrate,
    renotify: true,
    data: { url: '/', ...data }
  };

  try {
    // 1. Try via Service Worker (Best for Mobile PWAs in Standalone Mode)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, options);
        return { sent: true, method: 'serviceWorker' };
      }
    }

    // 2. Fallback to standard Window Notification
    const notif = new Notification(title, options);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return { sent: true, method: 'windowNotification' };
  } catch (err) {
    console.warn('[Notifications] Trigger failed:', err);
    return { sent: false, error: err.message };
  }
}

/**
 * Trigger explicit Creatine Reminder Notification
 */
export async function sendCreatineNotification() {
  return triggerLocalNotification({
    title: '⚡ Recordatorio de Creatina (5g) · AuraFit',
    body: '¿Ya tomaste tus 5g de Creatina Creapure hoy? Mantén tus depósitos de fosfocreatina al 100% para fuerza muscular y neuroprotección.',
    icon: '/icon-192.png',
    badge: '/favicon.png',
    tag: 'aurafit-creatine-reminder',
    vibrate: [250, 100, 250, 100, 250]
  });
}

/**
 * Trigger explicit Water Reminder Notification
 */
export async function sendWaterNotification(currentMl = 0, targetMl = 3000) {
  const percentage = Math.round((currentMl / Math.max(1, targetMl)) * 100);
  const remaining = Math.max(0, targetMl - currentMl);

  let message = `Llevas ${currentMl} ml (${percentage}% de tu meta). Toma un vaso de 250 ml ahora para optimizar tu volumen celular.`;
  if (remaining <= 0) {
    message = `¡Felicitaciones! Has completado tus ${targetMl} ml diarios. Toma pequeños sorbos para mantenerte hidratado.`;
  }

  return triggerLocalNotification({
    title: '💧 Hora de Hidratarte · AuraFit Biohacking',
    body: message,
    icon: '/icon-192.png',
    badge: '/favicon.png',
    tag: 'aurafit-water-reminder',
    vibrate: [200, 100, 200]
  });
}

/**
 * Evaluates whether a water or creatine notification should be dispatched based on timing
 */
export function evaluateReminders(config, state) {
  const now = Date.now();
  const todayKey = getLocalDateKey();
  const results = { triggerWater: false, triggerCreatine: false };

  if (!config || !config.enabled) return results;

  // 1. Water Reminder Check
  const intervalMs = (Number(config.waterIntervalMinutes) || 0) * 60 * 1000;
  if (intervalMs > 0) {
    const lastWater = config.lastWaterNotified ? Number(config.lastWaterNotified) : 0;
    if (now - lastWater >= intervalMs) {
      results.triggerWater = true;
    }
  }

  // 2. Creatine Reminder Check
  if (config.creatineReminderTime && !state.creatineDone) {
    if (config.lastCreatineNotifiedDate !== todayKey) {
      const [targetH, targetM] = config.creatineReminderTime.split(':').map(Number);
      const currentTime = new Date();
      const currentH = currentTime.getHours();
      const currentM = currentTime.getMinutes();

      // If current hour and minute have reached or passed the target
      if (currentH > targetH || (currentH === targetH && currentM >= targetM)) {
        results.triggerCreatine = true;
      }
    }
  }

  return results;
}
