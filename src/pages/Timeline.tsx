import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePartnerProfile } from '../hooks/useCouple';
import { listenToTimeline } from '../firebase/firestore';
import { Memory } from '../types';
import MemoryCard from '../components/MemoryCard';
import EmptyState from '../components/EmptyState';
import { MemorySkeleton } from '../components/LoadingSkeleton';
import { formatDayLabel } from '../utils/dateUtils';
import { Link } from 'react-router-dom';

export default function Timeline() {
  const { profile, partnerId, couple } = useAuth();
  const partner = usePartnerProfile();
  const [memories, setMemories] = useState<Memory[] | null>(null);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    if (!couple) return;
    setMemories(null);
    const unsub = listenToTimeline(couple.coupleId, setMemories, pageSize);
    return unsub;
  }, [couple?.coupleId, pageSize]);

  const grouped = groupByDate(memories || []);

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 pb-24 md:pb-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="heading-serif text-2xl text-paper">Our Memories</h1>
        <Link to="/add" className="text-sm text-rose font-medium">+ Add</Link>
      </div>

      {memories === null ? (
        <div className="space-y-4">
          <MemorySkeleton /><MemorySkeleton /><MemorySkeleton />
        </div>
      ) : memories.length === 0 ? (
        <EmptyState
          emoji="📖"
          title="No memories yet"
          subtitle="Every story starts with a first page."
        />
      ) : (
        <div className="space-y-8">
          {grouped.map(([date, dayMemories]) => (
            <div key={date}>
              <p className="text-xs tracking-wide text-muted mb-3">{formatDayLabel(date)}</p>
              <div className="space-y-4">
                {dayMemories.map((m) => (
                  <MemoryCard
                    key={m.memoryId}
                    memory={m}
                    isMine={m.authorId !== partnerId}
                    authorName={m.authorId === partnerId ? partner?.name || 'Partner' : profile?.name || 'You'}
                    partnerName={partner?.name}
                  />
                ))}
              </div>
            </div>
          ))}
          {memories.length >= pageSize && (
            <button
              onClick={() => setPageSize((s) => s + 20)}
              className="w-full text-sm text-muted hover:text-paper py-3"
            >
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function groupByDate(memories: Memory[]): [string, Memory[]][] {
  const map = new Map<string, Memory[]>();
  for (const m of memories) {
    if (!map.has(m.date)) map.set(m.date, []);
    map.get(m.date)!.push(m);
  }
  return Array.from(map.entries());
}
