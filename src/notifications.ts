import { getFirebaseMessaging } from './firebase/config';

/** Convert "HH:MM" (24h) to "h:mm AM/PM" display string. */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}

/**
 * Schedules browser notifications via setTimeout for doses still upcoming today.
 * Only fires while the tab is open — FCM handles background delivery.
 */
export function scheduleNotifications(medName: string, times: string[]): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const now = new Date();

  for (const hhmm of times) {
    const [h, m] = hhmm.split(':').map(Number);
    const target = new Date(now);
    target.setHours(h, m, 0, 0);

    const msUntil = target.getTime() - now.getTime();
    if (msUntil <= 0) continue;

    setTimeout(() => {
      new Notification(`Time to take ${medName}`, {
        body: `Your ${formatTime(hhmm)} dose is due now.`,
        icon: '/icons/icon-192.png',
        tag: `${medName}-${hhmm}`,
      });
    }, msUntil);
  }
}

/**
 * Listens for FCM messages when the app is in the foreground
 * (the SW push handler only fires in background).
 * Call once after the user is authenticated.
 */
export async function setupForegroundMessages(): Promise<void> {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return;

  const { onMessage } = await import('firebase/messaging');

  onMessage(messaging, (payload) => {
    if (Notification.permission !== 'granted') return;
    const title = payload.notification?.title ?? 'Pill Reminder';
    const body = payload.notification?.body ?? 'Time for your dose.';
    new Notification(title, {
      body,
      icon: '/icons/icon-192.png',
      tag: (payload.data?.['tag'] as string | undefined) ?? 'pill-reminder',
    });
  });
}
