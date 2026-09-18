import type { TouchEvent } from 'react';
import { useState } from 'react';
import { Photo } from '../types';

export default function PhotoGrid({ photos }: { photos: Photo[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      <div
        className={`grid gap-1.5 mt-3 ${
          photos.length === 1
            ? 'grid-cols-1'
            : photos.length === 2
            ? 'grid-cols-2'
            : 'grid-cols-3'
        }`}
      >
        {photos.slice(0, 6).map((p, i) => (
          <button
            key={p.photoId}
            onClick={() => setActiveIndex(i)}
            className="relative aspect-square overflow-hidden rounded-lg bg-ink-light"
          >
            <img
              src={p.downloadUrl}
              alt={p.caption || ''}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            {i === 5 && photos.length > 6 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-sm font-medium">
                +{photos.length - 6}
              </div>
            )}
          </button>
        ))}
      </div>

      {activeIndex !== null && (
        <PhotoViewer
          photos={photos}
          index={activeIndex}
          onClose={() => setActiveIndex(null)}
          onNavigate={setActiveIndex}
        />
      )}
    </>
  );
}

function PhotoViewer({
  photos,
  index,
  onClose,
  onNavigate,
}: {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  const photo = photos[index];

  function handleTouch(e: TouchEvent) {
    const startX = e.changedTouches[0].clientX;
    const handler = (ev: TouchEvent) => {
      const endX = ev.changedTouches[0].clientX;
      const diff = startX - endX;
      if (diff > 50 && index < photos.length - 1) onNavigate(index + 1);
      if (diff < -50 && index > 0) onNavigate(index - 1);
      window.removeEventListener('touchend', handler);
    };
    window.addEventListener('touchend', handler);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
      onTouchStart={handleTouch}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 text-2xl leading-none"
        aria-label="Close"
      >
        ×
      </button>
      <img
        src={photo.downloadUrl}
        alt={photo.caption || ''}
        className="max-w-full max-h-[85vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      {photo.caption && (
        <p className="absolute bottom-6 left-0 right-0 text-center text-white/90 text-sm px-6">
          {photo.caption}
        </p>
      )}
      {photos.length > 1 && (
        <p className="absolute bottom-2 left-0 right-0 text-center text-white/50 text-xs">
          {index + 1} / {photos.length}
        </p>
      )}
    </div>
  );
}
