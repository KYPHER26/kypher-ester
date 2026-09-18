import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  createMemory,
  createPhotoRecord,
  updateMemory,
  deleteMemory,
  createNotification,
  getPhotosForMemory,
  deletePhotoRecord,
} from '../firebase/firestore';
import { uploadCouplePhoto, deleteCouplePhoto } from '../firebase/storage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Memory, Mood, MOOD_EMOJI, Photo } from '../types';
import { todayISO } from '../utils/dateUtils';
import { PHOTOS_ENABLED } from '../config/features';

const MOODS: Mood[] = ['happy', 'loved', 'moved', 'funny', 'flat', 'tired'];

export default function AddMemory() {
  const { user, couple, partnerId } = useAuth();
  const navigate = useNavigate();
  const { memoryId: editingId } = useParams();
  const isEditing = !!editingId;

  const [loaded, setLoaded] = useState(!isEditing);
  const [date, setDate] = useState(todayISO());
  const [title, setTitle] = useState('');
  const [whatIDid, setWhatIDid] = useState('');
  const [howMyDayWent, setHowMyDayWent] = useState('');
  const [forPartner, setForPartner] = useState('');
  const [mood, setMood] = useState<Mood | null>(null);
  const [location, setLocation] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSpecial, setIsSpecial] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<Photo[]>([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  // Load the existing memory when editing.
  useEffect(() => {
    if (!isEditing || !editingId) return;
    (async () => {
      const snap = await getDoc(doc(db, 'memories', editingId));
      if (!snap.exists()) {
        navigate('/timeline');
        return;
      }
      const m = snap.data() as Memory;
      setDate(m.date);
      setTitle(m.title);
      setWhatIDid(m.whatIDid || '');
      setHowMyDayWent(m.howMyDayWent || '');
      setForPartner(m.forPartner || '');
      setMood(m.mood || null);
      setLocation(m.location || '');
      setTags(m.tags || []);
      setIsSpecial(m.isSpecial || false);
      if (m.photoIds?.length) {
        setExistingPhotos(await getPhotosForMemory(editingId));
      }
      setLoaded(true);
    })();
  }, [isEditing, editingId]);

  function addTag() {
    const t = tagInput.trim().replace(/^#/, '');
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  }

  function removeExistingPhoto(photoId: string) {
    setExistingPhotos((prev) => prev.filter((p) => p.photoId !== photoId));
    setRemovedPhotoIds((prev) => [...prev, photoId]);
  }

  async function save() {
    if (!user || !couple || !title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        date,
        title: title.trim(),
        whatIDid: whatIDid.trim() || undefined,
        howMyDayWent: howMyDayWent.trim() || undefined,
        forPartner: forPartner.trim() || undefined,
        mood: mood || undefined,
        location: location.trim() || undefined,
        tags,
        isSpecial,
      };

      let memoryId: string;
      let keptPhotoIds: string[];

      if (isEditing && editingId) {
        memoryId = editingId;
        setProgress('Saving changes...');
        // Delete any photos the user removed from this edit.
        for (const photoId of removedPhotoIds) {
          const photo = existingPhotos.find((p) => p.photoId === photoId) ||
            (await getPhotosForMemory(editingId)).find((p) => p.photoId === photoId);
          if (photo) {
            await deleteCouplePhoto(photo.storagePath).catch(() => {});
            await deletePhotoRecord(photoId);
          }
        }
        keptPhotoIds = existingPhotos.map((p) => p.photoId);
      } else {
        setProgress('Saving memory...');
        memoryId = await createMemory(couple.coupleId, user.uid, { ...payload, photoIds: [] });
        keptPhotoIds = [];
      }

      const newPhotoIds: string[] = [];
      if (PHOTOS_ENABLED) {
        for (let i = 0; i < files.length; i++) {
          setProgress(`Uploading photo ${i + 1} of ${files.length}...`);
          const { storagePath, downloadUrl } = await uploadCouplePhoto(couple.coupleId, files[i]);
          const photoId = await createPhotoRecord({
            coupleId: couple.coupleId,
            uploaderId: user.uid,
            memoryId,
            storagePath,
            downloadUrl,
          });
          newPhotoIds.push(photoId);
        }
      }

      await updateMemory(memoryId, { ...payload, photoIds: [...keptPhotoIds, ...newPhotoIds] });

      if (!isEditing && partnerId) {
        await createNotification(couple.coupleId, partnerId, user.uid, 'new_memory', memoryId);
      }

      navigate('/timeline');
    } finally {
      setSaving(false);
      setProgress(null);
    }
  }

  async function handleDelete() {
    if (!editingId) return;
    const photos = await getPhotosForMemory(editingId);
    for (const p of photos) {
      await deleteCouplePhoto(p.storagePath).catch(() => {});
      await deletePhotoRecord(p.photoId);
    }
    await deleteMemory(editingId);
    navigate('/timeline');
  }

  if (!loaded) {
    return <div className="max-w-xl mx-auto px-4 py-8 text-sm text-muted">Loading...</div>;
  }

  return (
    <div className="max-w-xl mx-auto px-4 md:px-8 py-8 pb-24 md:pb-12">
      <h1 className="heading-serif text-2xl text-paper mb-6">
        {isEditing ? 'Edit Memory' : '+ Add Memory ❤️'}
      </h1>

      <div className="space-y-5">
        <Field label="Date">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-ink-light border border-ink-border rounded-xl px-4 py-3 text-paper focus:outline-none focus:border-rose"
          />
        </Field>

        <Field label="Title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My day"
            className="w-full bg-ink-light border border-ink-border rounded-xl px-4 py-3 text-paper placeholder:text-muted focus:outline-none focus:border-rose"
          />
        </Field>

        <Field label="What did you do today?">
          <textarea
            value={whatIDid}
            onChange={(e) => setWhatIDid(e.target.value)}
            rows={3}
            className="w-full bg-ink-light border border-ink-border rounded-xl px-4 py-3 text-paper placeholder:text-muted focus:outline-none focus:border-rose resize-none"
          />
        </Field>

        <Field label="How was your day?">
          <textarea
            value={howMyDayWent}
            onChange={(e) => setHowMyDayWent(e.target.value)}
            rows={3}
            className="w-full bg-ink-light border border-ink-border rounded-xl px-4 py-3 text-paper placeholder:text-muted focus:outline-none focus:border-rose resize-none"
          />
        </Field>

        <Field label="Something I want my partner to know">
          <textarea
            value={forPartner}
            onChange={(e) => setForPartner(e.target.value)}
            rows={2}
            className="w-full bg-ink-light border border-ink-border rounded-xl px-4 py-3 text-paper placeholder:text-muted focus:outline-none focus:border-rose resize-none"
          />
        </Field>

        <Field label="Mood">
          <div className="flex gap-2">
            {MOODS.map((m) => (
              <button
                key={m}
                onClick={() => setMood(mood === m ? null : m)}
                className={`text-2xl w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                  mood === m ? 'bg-rose/20 ring-2 ring-rose' : 'bg-ink-light hover:bg-ink-border'
                }`}
              >
                {MOOD_EMOJI[m]}
              </button>
            ))}
          </div>
        </Field>

        {PHOTOS_ENABLED ? (
          <>
            {existingPhotos.length > 0 && (
              <Field label="Current photos">
                <div className="grid grid-cols-4 gap-2">
                  {existingPhotos.map((p) => (
                    <div key={p.photoId} className="relative aspect-square rounded-lg overflow-hidden">
                      <img src={p.downloadUrl} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeExistingPhoto(p.photoId)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-xs flex items-center justify-center"
                        aria-label="Remove photo"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </Field>
            )}

            <Field label={existingPhotos.length > 0 ? 'Add more photos' : 'Photos'}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="w-full text-sm text-muted"
              />
              {files.length > 0 && (
                <p className="text-xs text-muted mt-1">{files.length} photo(s) selected</p>
              )}
            </Field>
          </>
        ) : (
          <Field label="Photos">
            <p className="text-xs text-muted bg-ink-light border border-ink-border rounded-xl px-4 py-3">
              📸 Photo uploads will be available once Storage is set up. This memory will save fine without them for now.
            </p>
          </Field>
        )}

        <Field label="Location (optional)">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Where were you?"
            className="w-full bg-ink-light border border-ink-border rounded-xl px-4 py-3 text-paper placeholder:text-muted focus:outline-none focus:border-rose"
          />
        </Field>

        <Field label="Tags">
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="+ Add tag"
              className="flex-1 bg-ink-light border border-ink-border rounded-xl px-4 py-3 text-paper placeholder:text-muted focus:outline-none focus:border-rose"
            />
            <button onClick={addTag} className="px-4 text-rose text-sm">Add</button>
          </div>
          {tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-2">
              {tags.map((t) => (
                <button
                  key={t}
                  onClick={() => setTags(tags.filter((x) => x !== t))}
                  className="text-xs px-2.5 py-1 rounded-full bg-ink-border text-paper"
                >
                  #{t} ×
                </button>
              ))}
            </div>
          )}
        </Field>

        <label className="flex items-center gap-2.5 text-sm text-paper">
          <input
            type="checkbox"
            checked={isSpecial}
            onChange={(e) => setIsSpecial(e.target.checked)}
            className="w-4 h-4 accent-rose"
          />
          Mark as ❤️ Special Memory
        </label>

        <button
          onClick={save}
          disabled={!title.trim() || saving}
          className="w-full bg-rose text-white rounded-xl py-3.5 font-medium hover:bg-rose-dim transition-colors disabled:opacity-40"
        >
          {progress || (isEditing ? 'Save Changes' : 'Save Memory ❤️')}
        </button>

        {isEditing && (
          <button
            onClick={handleDelete}
            className="w-full text-sm text-muted hover:text-rose py-2"
          >
            Delete this memory
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-muted mb-1.5">{label}</label>
      {children}
    </div>
  );
}
