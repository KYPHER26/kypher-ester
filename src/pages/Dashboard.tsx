import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePartnerProfile } from '../hooks/useCouple';
import RelationshipCounter from '../components/RelationshipCounter';
import MemoryCard from '../components/MemoryCard';
import EmptyState from '../components/EmptyState';
import {
  getMemoriesForDate,
  listenToTimeline,
  getMemoriesOnThisDay,
} from '../firebase/firestore';
import { Memory } from '../types';
import { todayISO, daysUntil, formatLongDate } from '../utils/dateUtils';
import { PHOTOS_ENABLED } from '../config/features';

export default function Dashboard() {
  const { profile, partnerId, couple } = useAuth();
  const partner = usePartnerProfile();
  const [todayMemories, setTodayMemories] = useState<Memory[]>([]);
  const [recent, setRecent] = useState<Memory[]>([]);
  const [onThisDay, setOnThisDay] = useState<Memory[]>([]);

  useEffect(() => {
    if (!couple) return;
    getMemoriesForDate(couple.coupleId, todayISO()).then(setTodayMemories);
    const now = new Date();
    getMemoriesOnThisDay(couple.coupleId, now.getMonth() + 1, now.getDate()).then(setOnThisDay);
    const unsub = listenToTimeline(couple.coupleId, (all) => setRecent(all.slice(0, 4)), 4);
    return unsub;
  }, [couple?.coupleId]);

  const greeting = getGreeting();
  const daysToAnniversary = couple?.anniversaryDate ? daysUntil(couple.anniversaryDate) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 pb-24 md:pb-12">
      <p className="heading-serif text-2xl text-paper mb-1">
        {greeting}, {profile?.name} <span className="text-rose">❤</span>
      </p>
      <p className="text-sm text-muted mb-6">{formatLongDate(todayISO())}</p>

      <div className="rounded-2xl border border-ink-border bg-gradient-to-br from-ink-light to-ink p-6 mb-6">
        <p className="heading-serif text-xl text-paper mb-3">
          ESTER <span className="text-rose">❤</span> KYPHER
        </p>
        {couple ? (
          <RelationshipCounter startDate={couple.relationshipStartDate} />
        ) : (
          <p className="text-sm text-muted">Waiting for both of you to sign in for the first time.</p>
        )}
        <p className="heading-serif text-sm text-paper/70 italic mt-4">
          {couple?.quote || 'Another day in our story.'}
        </p>
      </div>

      {daysToAnniversary !== null && daysToAnniversary <= 30 && (
        <div className="rounded-xl bg-gold/10 border border-gold/30 px-4 py-3 mb-6 text-sm text-gold">
          💌 Your anniversary is in {daysToAnniversary} {daysToAnniversary === 1 ? 'day' : 'days'}
        </div>
      )}

      <div className="flex gap-3 mb-8">
        <Link
          to="/add"
          className={`text-center bg-rose text-white rounded-xl py-3 text-sm font-medium hover:bg-rose-dim transition-colors ${PHOTOS_ENABLED ? 'flex-1' : 'w-full'}`}
        >
          + Add Memory ❤️
        </Link>
        {PHOTOS_ENABLED && (
          <Link
            to="/gallery"
            className="flex-1 text-center bg-ink-light border border-ink-border text-paper rounded-xl py-3 text-sm font-medium hover:bg-ink-border/60 transition-colors"
          >
            📸 Upload Photo
          </Link>
        )}
      </div>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-muted mb-3">Today's memories</h2>
        {todayMemories.length === 0 ? (
          <EmptyState
            emoji="❤️"
            title="No memories yet today"
            subtitle="Maybe you or your partner should start today's story."
          />
        ) : (
          <div className="space-y-4">
            {todayMemories.map((m) => (
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
      </section>

      {onThisDay.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium text-gold mb-3">❤️ On this day</h2>
          <div className="space-y-4">
            {onThisDay.map((m) => (
              <MemoryCard
                key={m.memoryId}
                memory={m}
                isMine={m.authorId !== partnerId}
                authorName={m.authorId === partnerId ? partner?.name || 'Partner' : profile?.name || 'You'}
                partnerName={partner?.name}
              />
            ))}
          </div>
          <p className="heading-serif text-sm text-muted italic mt-3">Look how far your story has come.</p>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted">Recent memories</h2>
          <Link to="/timeline" className="text-xs text-rose">See all</Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState emoji="📖" title="Your story starts here" subtitle="Add your first memory together." />
        ) : (
          <div className="space-y-4">
            {recent.map((m) => (
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
      </section>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
