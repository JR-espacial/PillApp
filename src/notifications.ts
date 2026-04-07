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
 * Schedules browser notifications for each dose time today.
 * Times that have already passed are skipped.
 * Notifications fire while the app tab is open; for background delivery
 * a Firebase Cloud Messaging backend would be needed.
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
