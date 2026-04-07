import { useEffect, useState } from 'react';
import {
  collection, onSnapshot, setDoc, addDoc, doc, query, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Dose } from '../types';

interface UseTodayDosesResult {
  doses: Dose[];
  markTaken: (doseId: string, dose: Dose) => Promise<void>;
  loading: boolean;
}

export function useTodayDoses(uid: string | null): UseTodayDosesResult {
  const [doses, setDoses] = useState<Dose[]>([]);
  const [loading, setLoading] = useState(false);
  const todayISO = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    const q = query(collection(db, 'users', uid, 'doses'), where('date', '==', todayISO));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDoses(snapshot.docs.map((d) => {
        const { date: _date, ...rest } = d.data() as Dose & { date: string };
        return { id: d.id, ...rest };
      }));
      setLoading(false);
    });
    return unsubscribe;
  }, [uid, todayISO]);

  if (!uid) return { doses: [], markTaken: async () => {}, loading: false };

  const markTaken = async (doseId: string, dose: Dose) => {
    await setDoc(doc(db, 'users', uid, 'doses', doseId), { status: 'Taken' }, { merge: true });
    await addDoc(collection(db, 'users', uid, 'history'), {
      medicationName: dose.medicationName,
      dosage: dose.type ?? '',
      time: dose.time,
      status: 'Taken',
      date: todayISO,
      createdAt: serverTimestamp(),
    });
  };

  return { doses, markTaken, loading };
}
