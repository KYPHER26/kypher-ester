import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { listenToGallery, deletePhotoRecord } from '../firebase/firestore';
import { deleteCouplePhoto, uploadCouplePhoto } from '../firebase/storage';
import { createPhotoRecord } from '../firebase/firestore';
import { Photo } from '../types';
import { GridSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { PHOTOS_ENABLED } from '../config/features';

export default function Gallery() {
  const { user, couple } = useAuth();
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!couple) return;
    const unsub = listenToGallery(couple.coupleId, setPhotos);
    return unsub;
  }, [couple?.coupleId]);

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || !couple || !user) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const { storagePath, downloadUrl } = await uploadCouplePhoto(couple.coupleId, file);
        await createPhotoRecord({
          coupleId: couple.coupleId,
          uploaderId: user.uid,
          storagePath,
          downloadUrl,
        });
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(photo: Photo) {
    if (photo.uploaderId !== user?.uid) return;
    await deleteCouplePhoto(photo.storagePath);
    await deletePhotoRecord(photo.photoId);
    setActivePhoto(null);
  }

  const grouped = groupByMonth(photos || []);

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 pb-24 md:pb-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="heading-serif text-2xl text-paper">📸 Our Gallery</h1>
        {PHOTOS_ENABLED && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-sm bg-rose text-white px-4 py-2 rounded-full font-medium disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : '+ Upload'}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {!PHOTOS_ENABLED ? (
        <EmptyState
          emoji="📸"
          title="Photos are coming soon"
          subtitle="Storage isn't set up yet — memories are saving fine without photos in the meantime."
        />
      ) : photos === null ? (
        <GridSkeleton count={9} />
      ) : photos.length === 0 ? (
        <EmptyState
          emoji="📸"
          title="Our gallery is waiting for memories"
          actionLabel="Upload Photo"
          onAction={() => inputRef.current?.click()}
        />
      ) : (
        <div className="space-y-8">
          {grouped.map(([month, monthPhotos]) => (
            <div key={month}>
              <p className="text-xs tracking-wide text-muted mb-2">{month}</p>
              <div className="grid grid-cols-3 gap-1.5">
                {monthPhotos.map((p) => (
                  <button
                    key={p.photoId}
                    onClick={() => setActivePhoto(p)}
                    className="aspect-square rounded-lg overflow-hidden bg-ink-light"
                  >
                    <img src={p.downloadUrl} alt={p.caption || ''} loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center"
          onClick={() => setActivePhoto(null)}
        >
          <button
            onClick={() => setActivePhoto(null)}
            className="absolute top-4 right-4 text-white/80 text-2xl"
          >
            ×
          </button>
          <img
            src={activePhoto.downloadUrl}
            className="max-w-full max-h-[80vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {activePhoto.uploaderId === user?.uid && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(activePhoto); }}
              className="mt-4 text-sm text-rose"
            >
              Delete photo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function groupByMonth(photos: Photo[]): [string, Photo[]][] {
  const map = new Map<string, Photo[]>();
  for (const p of photos) {
    const d = new Date(p.createdAt);
    const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return Array.from(map.entries());
}
