import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { getRelationshipStats } from '../firebase/firestore';
import { UserProfile } from '../types';

export function usePartnerProfile() {
  const { partnerId } = useAuth();
  const [partner, setPartner] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!partnerId) {
      setPartner(null);
      return;
    }
    getDoc(doc(db, 'users', partnerId)).then((snap) => {
      if (snap.exists()) setPartner(snap.data() as UserProfile);
    });
  }, [partnerId]);

  return partner;
}

export function useRelationshipStats() {
  const { couple } = useAuth();
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getRelationshipStats>> | null>(null);

  useEffect(() => {
    if (!couple) return;
    getRelationshipStats(couple.coupleId).then(setStats);
  }, [couple?.coupleId]);

  return stats;
}
