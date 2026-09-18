import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as fbLimit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './config';
import {
  Memory,
  Photo,
  Comment,
  Reaction,
  ReactionType,
  AppNotification,
  NotificationType,
  Milestone,
} from '../types';

const PAGE_SIZE = 15;

// ---------- Memories ----------

export async function createMemory(
  coupleId: string,
  authorId: string,
  data: Omit<Memory, 'memoryId' | 'coupleId' | 'authorId' | 'createdAt' | 'updatedAt'>
) {
  const ref = collection(db, 'memories');
  const now = Date.now();
  const docRef = await addDoc(ref, {
    coupleId,
    authorId,
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateMemory(memoryId: string, data: Partial<Memory>) {
  await updateDoc(doc(db, 'memories', memoryId), {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteMemory(memoryId: string) {
  await deleteDoc(doc(db, 'memories', memoryId));
}

export function listenToTimeline(
  coupleId: string,
  onData: (memories: Memory[]) => void,
  max = PAGE_SIZE
) {
  const q = query(
    collection(db, 'memories'),
    where('coupleId', '==', coupleId),
    orderBy('date', 'desc'),
    fbLimit(max)
  );
  return onSnapshot(q, (snap) => {
    onData(
      snap.docs.map((d) => ({ memoryId: d.id, ...(d.data() as any) }))
    );
  });
}

export async function getMemoriesForDate(coupleId: string, date: string) {
  const q = query(
    collection(db, 'memories'),
    where('coupleId', '==', coupleId),
    where('date', '==', date)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ memoryId: d.id, ...(d.data() as any) })) as Memory[];
}

export async function getSpecialMemories(coupleId: string) {
  const q = query(
    collection(db, 'memories'),
    where('coupleId', '==', coupleId),
    where('isSpecial', '==', true),
    orderBy('date', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ memoryId: d.id, ...(d.data() as any) })) as Memory[];
}

export async function getMemoriesOnThisDay(coupleId: string, month: number, day: number) {
  // Firestore can't query on month/day directly, so pull memories per past
  // year and filter client side. Cheap because it's capped to N years.
  const results: Memory[] = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 1; y >= currentYear - 8; y--) {
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = `${y}-${mm}-${dd}`;
    const found = await getMemoriesForDate(coupleId, dateStr);
    results.push(...found);
  }
  return results;
}

export async function searchMemories(coupleId: string, term: string) {
  // Firestore has no full-text search; fetch a reasonable window and
  // filter client-side. For a two-person app this stays small.
  const q = query(
    collection(db, 'memories'),
    where('coupleId', '==', coupleId),
    orderBy('date', 'desc'),
    fbLimit(500)
  );
  const snap = await getDocs(q);
  const all = snap.docs.map((d) => ({ memoryId: d.id, ...(d.data() as any) })) as Memory[];
  const needle = term.toLowerCase();
  return all.filter((m) =>
    [m.title, m.whatIDid, m.howMyDayWent, m.forPartner, m.location, m.date, ...(m.tags || [])]
      .filter(Boolean)
      .some((f) => String(f).toLowerCase().includes(needle))
  );
}

// ---------- Photos ----------

export async function createPhotoRecord(
  data: Omit<Photo, 'photoId' | 'createdAt'>
) {
  const docRef = await addDoc(collection(db, 'photos'), {
    ...data,
    createdAt: Date.now(),
  });
  return docRef.id;
}

export async function deletePhotoRecord(photoId: string) {
  await deleteDoc(doc(db, 'photos', photoId));
}

export function listenToGallery(
  coupleId: string,
  onData: (photos: Photo[]) => void
) {
  const q = query(
    collection(db, 'photos'),
    where('coupleId', '==', coupleId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ photoId: d.id, ...(d.data() as any) })));
  });
}

export async function getPhotosForMemory(memoryId: string) {
  const q = query(collection(db, 'photos'), where('memoryId', '==', memoryId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ photoId: d.id, ...(d.data() as any) })) as Photo[];
}

// ---------- Comments ----------

export async function addComment(
  memoryId: string,
  coupleId: string,
  authorId: string,
  content: string
) {
  await addDoc(collection(db, 'comments'), {
    memoryId,
    coupleId,
    authorId,
    content,
    createdAt: Date.now(),
  });
}

export function listenToComments(
  memoryId: string,
  onData: (comments: Comment[]) => void
) {
  const q = query(
    collection(db, 'comments'),
    where('memoryId', '==', memoryId),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ commentId: d.id, ...(d.data() as any) })));
  });
}

// ---------- Reactions ----------

export async function setReaction(
  memoryId: string,
  coupleId: string,
  userId: string,
  reactionType: ReactionType
) {
  // One reaction per user per memory — a deterministic doc id makes
  // re-reacting overwrite the previous reaction instead of stacking.
  const reactionId = `${memoryId}_${userId}`;
  await setDoc(doc(db, 'reactions', reactionId), {
    memoryId,
    coupleId,
    userId,
    reactionType,
    createdAt: Date.now(),
  });
}

export async function removeReaction(memoryId: string, userId: string) {
  await deleteDoc(doc(db, 'reactions', `${memoryId}_${userId}`));
}

export function listenToReactions(
  memoryId: string,
  onData: (reactions: Reaction[]) => void
) {
  const q = query(collection(db, 'reactions'), where('memoryId', '==', memoryId));
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ reactionId: d.id, ...(d.data() as any) })));
  });
}

// ---------- Notifications ----------

export async function createNotification(
  coupleId: string,
  recipientId: string,
  senderId: string,
  type: NotificationType,
  referenceId: string
) {
  await addDoc(collection(db, 'notifications'), {
    coupleId,
    recipientId,
    senderId,
    type,
    referenceId,
    read: false,
    createdAt: Date.now(),
  });
}

export function listenToNotifications(
  recipientId: string,
  onData: (items: AppNotification[]) => void
) {
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', recipientId),
    orderBy('createdAt', 'desc'),
    fbLimit(30)
  );
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ notificationId: d.id, ...(d.data() as any) })));
  });
}

export async function markNotificationRead(notificationId: string) {
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });
}

// ---------- Milestones (Our Story) ----------

export async function addMilestone(
  coupleId: string,
  data: Omit<Milestone, 'milestoneId' | 'coupleId' | 'createdAt'>
) {
  await addDoc(collection(db, 'milestones'), {
    coupleId,
    ...data,
    createdAt: Date.now(),
  });
}

export function listenToMilestones(
  coupleId: string,
  onData: (items: Milestone[]) => void
) {
  const q = query(
    collection(db, 'milestones'),
    where('coupleId', '==', coupleId),
    orderBy('date', 'asc')
  );
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ milestoneId: d.id, ...(d.data() as any) })));
  });
}

// ---------- Stats ----------

export async function getRelationshipStats(coupleId: string) {
  const memSnap = await getDocs(
    query(collection(db, 'memories'), where('coupleId', '==', coupleId))
  );
  const photoSnap = await getDocs(
    query(collection(db, 'photos'), where('coupleId', '==', coupleId))
  );
  const memories = memSnap.docs.map((d) => d.data() as Memory);
  const photos = photoSnap.docs;

  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const uniqueDays = new Set(memories.map((m) => m.date));

  return {
    totalMemories: memories.length,
    totalPhotos: photos.length,
    specialMemories: memories.filter((m) => m.isSpecial).length,
    daysWithMemories: uniqueDays.size,
    memoriesThisMonth: memories.filter((m) => m.date.startsWith(thisMonthKey)).length,
    photosThisMonth: photos.filter((p) =>
      new Date((p.data() as Photo).createdAt).toISOString().slice(0, 7) === thisMonthKey
    ).length,
  };
}
