import { Link } from 'react-router-dom';
import { Memory } from '../types';
import { MOOD_EMOJI } from '../types';
import PhotoGrid from './PhotoGrid';
import ReactionBar from './ReactionBar';
import CommentThread from './CommentThread';
import { usePhotosForMemory } from '../hooks/useMemories';

export default function MemoryCard({
  memory,
  authorName,
  isMine,
  partnerName,
}: {
  memory: Memory;
  authorName: string;
  isMine: boolean;
  partnerName?: string;
}) {
  const photos = usePhotosForMemory(memory.memoryId, memory.photoIds);

  return (
    <article className="rounded-2xl border border-ink-border bg-ink-light/40 p-5">
      <header className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={isMine ? 'text-rose' : 'text-plum'}>{isMine ? '❤️' : '💗'}</span>
          <span className="text-sm font-medium text-paper">{authorName}</span>
          {memory.isSpecial && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gold/15 text-gold">Special</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {memory.mood && <span className="text-lg">{MOOD_EMOJI[memory.mood]}</span>}
          {isMine && (
            <Link to={`/edit/${memory.memoryId}`} className="text-xs text-muted hover:text-paper">
              Edit
            </Link>
          )}
        </div>
      </header>

      {memory.title && (
        <h3 className="heading-serif text-lg text-paper mb-1.5">{memory.title}</h3>
      )}

      {memory.whatIDid && <p className="text-sm text-paper/90 leading-relaxed">{memory.whatIDid}</p>}
      {memory.howMyDayWent && (
        <p className="text-sm text-muted leading-relaxed mt-1.5">{memory.howMyDayWent}</p>
      )}
      {memory.forPartner && (
        <p className="text-sm text-rose/90 leading-relaxed mt-2 italic">
          "{memory.forPartner}"
        </p>
      )}

      {memory.location && (
        <p className="text-xs text-muted mt-2">📍 {memory.location}</p>
      )}

      {memory.tags?.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mt-2">
          {memory.tags.map((t) => (
            <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-ink-border/60 text-muted">
              #{t}
            </span>
          ))}
        </div>
      )}

      <PhotoGrid photos={photos} />

      <div className="flex items-center justify-between mt-4">
        <ReactionBar memoryId={memory.memoryId} coupleId={memory.coupleId} />
      </div>
      <CommentThread
        memoryId={memory.memoryId}
        coupleId={memory.coupleId}
        authorName={(uid) => (uid === memory.authorId ? authorName : partnerName || 'Partner')}
        partnerName={partnerName}
      />
    </article>
  );
}
