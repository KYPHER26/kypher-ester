import { useEffect, useState } from 'react';
import { getPhotosForMemory } from '../firebase/firestore';
import { Photo } from '../types';

// Small per-memory photo cache so switching pages doesn't re-fetch photos
// for memories already seen this session.
const photoCache = new Map<string, Photo[]>();

export function usePhotosForMemory(memoryId: string, photoIds: string[] = []) {
  const [photos, setPhotos] = useState<Photo[]>(photoCache.get(memoryId) || []);

  useEffect(() => {
    if (photoIds.length === 0) {
      setPhotos([]);
      return;
    }
    if (photoCache.has(memoryId)) {
      setPhotos(photoCache.get(memoryId)!);
      return;
    }
    let active = true;
    getPhotosForMemory(memoryId).then((result) => {
      if (active) {
        photoCache.set(memoryId, result);
        setPhotos(result);
      }
    });
    return () => {
      active = false;
    };
  }, [memoryId, photoIds.length]);

  return photos;
}
