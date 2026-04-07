import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { HistoryItem } from '../types';

interface UseHistoryResult {
  history: HistoryItem[];
  loading: boolean;
}

export function useHistory(uid: string | null): UseHistoryResult {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    const q = query(collection(db, 'users', uid, 'history'), orderBy('createdAt', 'desc'), limit(30));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          medicationName: data.medicationName as string,
          dosage: data.dosage as string,
          time: data.time as string,
          status: data.status as 'Taken' | 'Missed',
          date: data.date as string,
        };
      }));
      setLoading(false);
    });
    return unsubscribe;
  }, [uid]);

  if (!uid) return { history: [], loading: false };

  return { history, loading };
}
