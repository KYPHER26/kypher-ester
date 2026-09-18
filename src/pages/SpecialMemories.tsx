import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePartnerProfile } from '../hooks/useCouple';
import { getSpecialMemories } from '../firebase/firestore';
import { Memory } from '../types';
import MemoryCard from '../components/MemoryCard';
import EmptyState from '../components/EmptyState';

export default function SpecialMemories() {
  const { profile, partnerId, couple } = useAuth();
  const partner = usePartnerProfile();
  const [memories, setMemories] = useState<Memory[] | null>(null);

  useEffect(() => {
    if (!couple) return;
    getSpecialMemories(couple.coupleId).then(setMemories);
  }, [couple?.coupleId]);

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 pb-24 md:pb-12">
      <h1 className="heading-serif text-2xl text-paper mb-6">❤️ Our Special Memories</h1>

      {memories === null ? null : memories.length === 0 ? (
        <EmptyState emoji="❤️" title="No special memories marked yet" subtitle="Mark a memory as special when you add or edit it." />
      ) : (
        <div className="space-y-4">
          {memories.map((m) => (
            <MemoryCard
              key={m.memoryId}
              memory={m}
              isMine={m.authorId !== partnerId}
              authorName={m.authorId === partnerId ? partner?.name || 'Partner' : profile?.name || 'You'}
              partnerName={partner?.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
