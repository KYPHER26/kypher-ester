import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { listenToMilestones, addMilestone } from '../firebase/firestore';
import { Milestone } from '../types';
import { formatLongDate } from '../utils/dateUtils';
import EmptyState from '../components/EmptyState';

export default function OurStory() {
  const { couple } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [icon, setIcon] = useState('❤️');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!couple) return;
    const unsub = listenToMilestones(couple.coupleId, setMilestones);
    return unsub;
  }, [couple?.coupleId]);

  async function save() {
    if (!couple || !title.trim() || !date) return;
    await addMilestone(couple.coupleId, { title: title.trim(), date, icon, description: description.trim() || undefined });
    setTitle(''); setDate(''); setDescription(''); setAdding(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 pb-24 md:pb-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="heading-serif text-2xl text-paper">💌 Our Story</h1>
        <button onClick={() => setAdding((a) => !a)} className="text-sm text-rose font-medium">
          {adding ? 'Cancel' : '+ Add Milestone'}
        </button>
      </div>

      {adding && (
        <div className="rounded-2xl border border-ink-border bg-ink-light/40 p-4 mb-6 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Milestone title (e.g. Our first date)"
            className="w-full bg-ink border border-ink-border rounded-xl px-4 py-2.5 text-paper placeholder:text-muted focus:outline-none focus:border-rose"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-ink border border-ink-border rounded-xl px-4 py-2.5 text-paper focus:outline-none focus:border-rose"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short description (optional)"
            className="w-full bg-ink border border-ink-border rounded-xl px-4 py-2.5 text-paper placeholder:text-muted focus:outline-none focus:border-rose"
          />
          <div className="flex gap-2">
            {['❤️', '📸', '✈️', '🎉', '💍', '🏡'].map((e) => (
              <button
                key={e}
                onClick={() => setIcon(e)}
                className={`text-xl w-9 h-9 rounded-full flex items-center justify-center ${icon === e ? 'bg-rose/20 ring-2 ring-rose' : 'bg-ink'}`}
              >
                {e}
              </button>
            ))}
          </div>
          <button onClick={save} className="w-full bg-rose text-white rounded-xl py-2.5 text-sm font-medium">
            Save Milestone
          </button>
        </div>
      )}

      {milestones === null ? null : milestones.length === 0 ? (
        <EmptyState emoji="💌" title="Your story hasn't been written yet" subtitle="Add the moments that matter most." />
      ) : (
        <ol className="relative border-l border-ink-border ml-3 space-y-8">
          {milestones.map((m) => (
            <li key={m.milestoneId} className="ml-6">
              <span className="absolute -left-[29px] flex items-center justify-center w-8 h-8 rounded-full bg-ink-light border border-ink-border text-sm">
                {m.icon || '❤️'}
              </span>
              <p className="text-xs text-muted">{formatLongDate(m.date)}</p>
              <p className="heading-serif text-lg text-paper mt-0.5">{m.title}</p>
              {m.description && <p className="text-sm text-muted mt-1">{m.description}</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
