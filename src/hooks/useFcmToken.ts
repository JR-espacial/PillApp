import { useEffect } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { db, getFirebaseMessaging, VAPID_KEY } from '../firebase/config';
import { requestNotificationPermission } from '../notifications';

/**
 * Registers an FCM token for the current user once on mount.
 * Saves the token to users/{uid}/fcmTokens/{token} so the Cloud Function
 * can look it up when sending dose reminders.
 */
export function useFcmToken(uid: string | null): void {
  useEffect(() => {
    if (!uid) return;

    const register = async () => {
      const granted = await requestNotificationPermission();
      if (!granted) return;

      const messaging = await getFirebaseMessaging();
      if (!messaging) return;

      // Must pass the active SW registration so Firebase doesn't try to
      // register its own firebase-messaging-sw.js (which doesn't exist here)
      const swReg = await navigator.serviceWorker.ready;

      let token: string;
      try {
        token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swReg,
        });
      } catch {
        return; // blocked by browser or missing VAPID key
      }

      // Use token as document ID — makes upserts idempotent
      await setDoc(
        doc(db, 'users', uid, 'fcmTokens', token),
        { token, platform: 'web', updatedAt: serverTimestamp() },
        { merge: true }
      );
    };

    register().catch(console.error);
  }, [uid]);
}
