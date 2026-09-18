import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from './config';

// Compress + resize before upload so we don't ship full-resolution phone
// photos over mobile networks (see AGENTS: performance requirements).
export async function compressImage(file: File, maxDim = 1600, quality = 0.82): Promise<Blob> {
  const img = document.createElement('img');
  const url = URL.createObjectURL(file);
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = url;
  });

  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(url);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Compression failed'))),
      'image/jpeg',
      quality
    );
  });
}

export async function uploadCouplePhoto(
  coupleId: string,
  file: File,
  onProgress?: (pct: number) => void
) {
  const compressed = await compressImage(file);
  const path = `couples/${coupleId}/photos/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  const storageRef = ref(storage, path);
  onProgress?.(30);
  await uploadBytes(storageRef, compressed, { contentType: 'image/jpeg' });
  onProgress?.(80);
  const downloadUrl = await getDownloadURL(storageRef);
  onProgress?.(100);
  return { storagePath: path, downloadUrl };
}

export async function deleteCouplePhoto(storagePath: string) {
  await deleteObject(ref(storage, storagePath));
}
