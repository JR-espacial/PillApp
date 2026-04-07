import { useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { formatTime } from '../notifications';
import type { Medication } from '../types';

/** Convert local "HH:MM" to UTC "HH:MM" so the Cloud Function can match by UTC minute. */
function toUTCTimeRaw(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const now = new Date();
  // Build a Date representing today at the given local time
  const local = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
  const utcH = String(local.getUTCHours()).padStart(2, '0');
  const utcM = String(local.getUTCMinutes()).padStart(2, '0');
  return `${utcH}:${utcM}`;
}

interface UseMedicationsResult {
  meds: Medication[];
  addMed: (med: Omit<Medication, 'id'>) => Promise<string>;
  deleteMed: (id: string) => Promise<void>;
  loading: boolean;
}

export function useMedications(uid: string | null): UseMedicationsResult {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    const colRef = collection(db, 'users', uid, 'medications');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      setMeds(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Medication, 'id'>) })));
      setLoading(false);
    });
    return unsubscribe;
  }, [uid]);

  if (!uid) return { meds: [], addMed: async () => '', deleteMed: async () => {}, loading: false };

  const addMed = async (med: Omit<Medication, 'id'>): Promise<string> => {
    const batch = writeBatch(db);

    const medRef = doc(collection(db, 'users', uid, 'medications'));
    batch.set(medRef, med);

    const todayISO = new Date().toISOString().split('T')[0];
    for (const hhmm of med.times) {
      const doseRef = doc(collection(db, 'users', uid, 'doses'));
      batch.set(doseRef, {
        medicationId: medRef.id,
        medicationName: med.name,
        time: formatTime(hhmm),       // "8:00 AM" — display string for UI
        timeRaw: toUTCTimeRaw(hhmm),  // "HH:MM" UTC — for Cloud Function matching
        status: 'Upcoming',
        date: todayISO,
      });
    }

    await batch.commit();
    return medRef.id;
  };

  const deleteMed = async (id: string) => deleteDoc(doc(db, 'users', uid, 'medications', id));

  return { meds, addMed, deleteMed, loading };
}
