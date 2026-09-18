import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePartnerProfile } from '../hooks/useCouple';
import { getMemoriesForDate, listenToTimeline } from '../firebase/firestore';
import { Memory } from '../types';
import MemoryCard from '../components/MemoryCard';
import EmptyState from '../components/EmptyState';

export default function CalendarPage() {
  const { profile, partnerId, couple } = useAuth();
  const partner = usePartnerProfile();
  const [cursor, setCursor] = useState(() => new Date());
  const [datesWithMemories, setDatesWithMemories] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMemories, setSelectedMemories] = useState<Memory[]>([]);

  useEffect(() => {
    if (!couple) return;
    // Pull enough of the timeline to mark dots on the visible month.
    const unsub = listenToTimeline(couple.coupleId, (all) => {
      setDatesWithMemories(new Set(all.map((m) => m.date)));
    }, 400);
    return unsub;
  }, [couple?.coupleId]);

  useEffect(() => {
    if (!selectedDate || !couple) {
      setSelectedMemories([]);
      return;
    }
    getMemoriesForDate(couple.coupleId, selectedDate).then(setSelectedMemories);
  }, [selectedDate, couple?.coupleId]);

  const days = useMemo(() => buildMonthGrid(cursor), [cursor]);
  const monthLabel = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 pb-24 md:pb-12">
      <h1 className="heading-serif text-2xl text-paper mb-6">📅 Memory Calendar</h1>

      <div className="flex items-center justify-between mb-4">
        <button onClick={() => shiftMonth(cursor, -1, setCursor)} className="text-muted px-2">‹</button>
        <p className="text-sm font-medium text-paper">{monthLabel}</p>
        <button onClick={() => shiftMonth(cursor, 1, setCursor)} className="text-muted px-2">›</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => (
          <button
            key={i}
            disabled={!d}
            onClick={() => d && setSelectedDate(d.iso)}
            className={`aspect-square rounded-lg text-sm flex flex-col items-center justify-center gap-0.5 transition-colors ${
              !d ? '' : selectedDate === d.iso ? 'bg-rose text-white' : 'hover:bg-ink-light text-paper'
            }`}
          >
            {d && (
              <>
                <span>{d.day}</span>
                {datesWithMemories.has(d.iso) && (
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedDate === d.iso ? 'bg-white' : 'bg-rose'}`} />
                )}
              </>
            )}
          </button>
        ))}
      </div>

      {selectedDate && (
        <div className="mt-8">
          <p className="text-xs tracking-wide text-muted mb-3">{selectedDate}</p>
          {selectedMemories.length === 0 ? (
            <EmptyState emoji="🗓️" title="No memories on this date" />
          ) : (
            <div className="space-y-4">
              {selectedMemories.map((m) => (
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
      )}
    </div>
  );
}

function buildMonthGrid(cursor: Date) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: ({ day: number; iso: string } | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({ day, iso });
  }
  return cells;
}

function shiftMonth(cursor: Date, delta: number, setCursor: (d: Date) => void) {
  setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
}
