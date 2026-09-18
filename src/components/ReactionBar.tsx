import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { listenToReactions, setReaction, removeReaction } from '../firebase/firestore';
import { Reaction, ReactionType, REACTION_EMOJI } from '../types';

const OPTIONS: ReactionType[] = ['love', 'adore', 'moved', 'laugh', 'like'];

export default function ReactionBar({ memoryId, coupleId }: { memoryId: string; coupleId: string }) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsub = listenToReactions(memoryId, setReactions);
    return unsub;
  }, [memoryId]);

  const mine = reactions.find((r) => r.userId === user?.uid);

  async function pick(type: ReactionType) {
    if (!user) return;
    if (mine?.reactionType === type) {
      await removeReaction(memoryId, user.uid);
    } else {
      await setReaction(memoryId, coupleId, user.uid, type);
    }
    setOpen(false);
  }

  const counts = OPTIONS.map((type) => ({
    type,
    count: reactions.filter((r) => r.reactionType === type).length,
  })).filter((c) => c.count > 0);

  return (
    <div className="relative flex items-center gap-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
          mine ? 'border-rose text-rose bg-rose/10' : 'border-ink-border text-muted hover:text-paper'
        }`}
      >
        {mine ? REACTION_EMOJI[mine.reactionType] : '♡'} React
      </button>

      {counts.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted">
          {counts.map((c) => (
            <span key={c.type}>
              {REACTION_EMOJI[c.type]}
              {c.count > 1 && c.count}
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="absolute bottom-full mb-2 left-0 flex gap-1.5 bg-ink-light border border-ink-border rounded-full px-2 py-1.5 shadow-lg z-10">
          {OPTIONS.map((type) => (
            <button
              key={type}
              onClick={() => pick(type)}
              className="text-lg hover:scale-125 transition-transform"
              aria-label={type}
            >
              {REACTION_EMOJI[type]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
