import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { listenToNotifications, markNotificationRead } from '../firebase/firestore';
import { AppNotification } from '../types';

const LABELS: Record<string, string> = {
  new_memory: '❤️ added a new memory',
  new_photo: '📸 uploaded a new photo',
  new_comment: '💬 commented on your memory',
  new_reaction: '❤️ reacted to your memory',
  anniversary_soon: '💌 Your anniversary is coming soon',
};

export default function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = listenToNotifications(user.uid, setItems);
    return unsub;
  }, [user?.uid]);

  const unread = items.filter((i) => !i.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 rounded-full flex items-center justify-center text-paper hover:bg-ink-light"
        aria-label="Notifications"
      >
        🔔
        {unread > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-rose text-[10px] text-white flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-ink-light border border-ink-border rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="p-4 text-sm text-muted">No notifications yet.</p>
          ) : (
            items.map((n) => (
              <button
                key={n.notificationId}
                onClick={() => markNotificationRead(n.notificationId)}
                className={`block w-full text-left px-4 py-3 text-sm border-b border-ink-border last:border-0 ${
                  n.read ? 'text-muted' : 'text-paper'
                }`}
              >
                {LABELS[n.type] || n.type}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
