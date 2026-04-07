import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Runs every minute. Queries all dose documents across all users where:
 *   date == today (UTC ISO date)
 *   status == 'Upcoming'
 *   timeRaw == current UTC HH:MM
 * Then sends an FCM push to each user's registered devices.
 */
export const sendDoseReminders = onSchedule(
  {
    schedule: 'every 1 minutes',
    region: 'us-central1',
    timeoutSeconds: 60,
  },
  async () => {
    const now = new Date();
    const hh = String(now.getUTCHours()).padStart(2, '0');
    const mm = String(now.getUTCMinutes()).padStart(2, '0');
    const currentTimeRaw = `${hh}:${mm}`;
    const todayISO = now.toISOString().split('T')[0];

    const dosesSnap = await db
      .collectionGroup('doses')
      .where('date', '==', todayISO)
      .where('status', '==', 'Upcoming')
      .where('timeRaw', '==', currentTimeRaw)
      .get();

    if (dosesSnap.empty) return;

    // Group doses by uid (path: users/{uid}/doses/{doseId})
    const byUser = new Map<string, admin.firestore.QueryDocumentSnapshot[]>();
    for (const doseDoc of dosesSnap.docs) {
      const uid = doseDoc.ref.path.split('/')[1];
      if (!byUser.has(uid)) byUser.set(uid, []);
      byUser.get(uid)!.push(doseDoc);
    }

    const sendPromises: Promise<void>[] = [];

    for (const [uid, doses] of byUser.entries()) {
      sendPromises.push(
        (async () => {
          const tokensSnap = await db.collection(`users/${uid}/fcmTokens`).get();
          if (tokensSnap.empty) return;

          const tokens = tokensSnap.docs.map((d) => d.data()['token'] as string);

          for (const dose of doses) {
            const data = dose.data();
            const medName = data['medicationName'] as string;
            const displayTime = data['time'] as string;

            const message: admin.messaging.MulticastMessage = {
              tokens,
              notification: {
                title: `Time to take ${medName}`,
                body: `Your ${displayTime} dose is due now.`,
              },
              webpush: {
                notification: {
                  icon: '/icons/icon-192.png',
                  tag: `${medName}-${data['timeRaw'] as string}`,
                },
                fcmOptions: { link: '/' },
              },
              data: {
                tag: `${medName}-${data['timeRaw'] as string}`,
              },
            };

            const response = await messaging.sendEachForMulticast(message);

            // Remove stale tokens
            const staleTokens = tokens.filter((_, i) => {
              const err = response.responses[i].error;
              return (
                err?.code === 'messaging/registration-token-not-registered' ||
                err?.code === 'messaging/invalid-registration-token'
              );
            });

            if (staleTokens.length > 0) {
              const batch = db.batch();
              for (const staleToken of staleTokens) {
                const staleSnap = await db
                  .collection(`users/${uid}/fcmTokens`)
                  .where('token', '==', staleToken)
                  .get();
                staleSnap.docs.forEach((d) => batch.delete(d.ref));
              }
              await batch.commit();
            }
          }
        })()
      );
    }

    await Promise.all(sendPromises);
  }
);
