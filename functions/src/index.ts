import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';

initializeApp();
const db = getFirestore();

interface Couple {
  partner1Id: string;
  partner2Id: string;
  anniversaryDate?: string;
}

interface Memory {
  coupleId: string;
  authorId: string;
}

function otherPartner(couple: Couple, uid: string) {
  return couple.partner1Id === uid ? couple.partner2Id : couple.partner1Id;
}

async function createNotification(
  coupleId: string,
  recipientId: string,
  senderId: string,
  type: string,
  referenceId: string
) {
  await db.collection('notifications').add({
    coupleId,
    recipientId,
    senderId,
    type,
    referenceId,
    read: false,
    createdAt: Date.now(),
  });
}

/**
 * Someone commented on a memory -> notify the other partner.
 * (Skips notifying yourself if you comment on your own memory.)
 */
export const onCommentCreate = onDocumentCreated('comments/{commentId}', async (event) => {
  const comment = event.data?.data();
  if (!comment) return;

  const memorySnap = await db.doc(`memories/${comment.memoryId}`).get();
  if (!memorySnap.exists) return;
  const memory = memorySnap.data() as Memory;

  const coupleSnap = await db.doc(`couples/${memory.coupleId}`).get();
  if (!coupleSnap.exists) return;
  const couple = coupleSnap.data() as Couple;

  const recipient = otherPartner(couple, comment.authorId);
  if (recipient === comment.authorId) return; // solo/dev mode safety

  await createNotification(memory.coupleId, recipient, comment.authorId, 'new_comment', comment.memoryId);
});

/**
 * A reaction was added or changed on a memory -> notify the memory's
 * author (unless they reacted to their own memory).
 */
export const onReactionWrite = onDocumentWritten('reactions/{reactionId}', async (event) => {
  const after = event.data?.after?.data();
  if (!after) return; // deleted, nothing to notify

  const before = event.data?.before?.data();
  if (before && before.reactionType === after.reactionType) return; // no real change

  const memorySnap = await db.doc(`memories/${after.memoryId}`).get();
  if (!memorySnap.exists) return;
  const memory = memorySnap.data() as Memory;

  if (memory.authorId === after.userId) return; // reacted to own memory

  await createNotification(memory.coupleId, memory.authorId, after.userId, 'new_reaction', after.memoryId);
});

/**
 * A photo was uploaded directly to the gallery (not attached to a
 * memory, which already notifies via the client when the memory saves)
 * -> notify the other partner.
 */
export const onGalleryPhotoCreate = onDocumentCreated('photos/{photoId}', async (event) => {
  const photo = event.data?.data();
  if (!photo || photo.memoryId) return; // memory photos are handled client-side

  const coupleSnap = await db.doc(`couples/${photo.coupleId}`).get();
  if (!coupleSnap.exists) return;
  const couple = coupleSnap.data() as Couple;

  const recipient = otherPartner(couple, photo.uploaderId);
  if (recipient === photo.uploaderId) return;

  await createNotification(photo.coupleId, recipient, photo.uploaderId, 'new_photo', event.params.photoId);
});

/**
 * Runs once a day. For every couple with an anniversaryDate set, checks
 * whether today falls 30/14/7/3/1/0 days out and — if a reminder for
 * today hasn't already gone out — notifies both partners.
 */
export const checkAnniversaries = onSchedule(
  { schedule: 'every day 09:00', timeZone: 'UTC' },
  async () => {
    const REMINDER_WINDOWS = [30, 14, 7, 3, 1, 0];
    const todayKey = new Date().toISOString().slice(0, 10);

    const couplesSnap = await db.collection('couples').get();

    for (const doc of couplesSnap.docs) {
      const couple = doc.data() as Couple & { lastAnniversaryNotifyDate?: string };
      if (!couple.anniversaryDate) continue;

      const daysOut = daysUntilAnnualDate(couple.anniversaryDate);
      if (!REMINDER_WINDOWS.includes(daysOut)) continue;
      if (couple.lastAnniversaryNotifyDate === todayKey) continue; // already sent today

      await createNotification(doc.id, couple.partner1Id, couple.partner2Id, 'anniversary_soon', doc.id);
      await createNotification(doc.id, couple.partner2Id, couple.partner1Id, 'anniversary_soon', doc.id);
      await doc.ref.update({ lastAnniversaryNotifyDate: todayKey });

      logger.info(`Sent anniversary reminder for couple ${doc.id} (${daysOut} days out)`);
    }
  }
);

function daysUntilAnnualDate(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate + 'T00:00:00');
  target.setFullYear(today.getFullYear());
  if (target < today) target.setFullYear(today.getFullYear() + 1);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
