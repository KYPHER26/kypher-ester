import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { listenToComments, addComment } from '../firebase/firestore';
import { Comment } from '../types';

export default function CommentThread({
  memoryId,
  coupleId,
  authorName,
  partnerName,
}: {
  memoryId: string;
  coupleId: string;
  authorName: (uid: string) => string;
  partnerName?: string;
}) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    const unsub = listenToComments(memoryId, setComments);
    return unsub;
  }, [memoryId]);

  async function submit() {
    if (!draft.trim() || !user) return;
    await addComment(memoryId, coupleId, user.uid, draft.trim());
    setDraft('');
  }

  return (
    <div className="mt-3">
      <button
        onClick={() => setShow((s) => !s)}
        className="text-xs text-muted hover:text-paper"
      >
        💬 {comments.length > 0 ? `${comments.length} comment${comments.length > 1 ? 's' : ''}` : 'Comment'}
      </button>

      {show && (
        <div className="mt-3 space-y-2.5">
          {comments.map((c) => (
            <div key={c.commentId} className="text-sm">
              <span className="text-rose font-medium">{authorName(c.authorId)}</span>{' '}
              <span className="text-paper/90">{c.content}</span>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder={`Reply to ${partnerName || 'them'}...`}
              className="flex-1 bg-ink-light border border-ink-border rounded-full px-4 py-1.5 text-sm text-paper placeholder:text-muted focus:outline-none focus:border-rose"
            />
            <button
              onClick={submit}
              className="text-sm text-rose font-medium px-2 disabled:opacity-40"
              disabled={!draft.trim()}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
