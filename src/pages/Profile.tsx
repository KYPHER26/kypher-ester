import { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { usePartnerProfile } from '../hooks/useCouple';
import { useRelationshipStats } from '../hooks/useCouple';
import { uploadCouplePhoto } from '../firebase/storage';
import ThemeToggle from '../components/ThemeToggle';
import { PHOTOS_ENABLED } from '../config/features';

export default function Profile() {
  const { user, profile, couple, refreshProfile, logout } = useAuth();
  const partner = usePartnerProfile();
  const stats = useRelationshipStats();

  const [quote, setQuote] = useState(couple?.quote || '');
  const [anniversary, setAnniversary] = useState(couple?.anniversaryDate || '');
  const [startDate, setStartDate] = useState(couple?.relationshipStartDate || '');

  useEffect(() => {
    setQuote(couple?.quote || '');
    setAnniversary(couple?.anniversaryDate || '');
    setStartDate(couple?.relationshipStartDate || '');
  }, [couple]);

  async function saveCoupleDetails() {
    if (!couple) return;
    await updateDoc(doc(db, 'couples', couple.coupleId), {
      quote,
      anniversaryDate: anniversary || null,
      relationshipStartDate: startDate,
    });
    refreshProfile();
  }

  async function handlePhotoUpload(file: File | null) {
    if (!file || !user || !couple) return;
    const { downloadUrl } = await uploadCouplePhoto(couple.coupleId, file);
    await updateDoc(doc(db, 'users', user.uid), { profilePhoto: downloadUrl });
    refreshProfile();
  }

  return (
    <div className="max-w-lg mx-auto px-4 md:px-8 py-8 pb-24 md:pb-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="heading-serif text-2xl text-paper">Profile</h1>
        <div className="md:hidden"><ThemeToggle /></div>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <label className={PHOTOS_ENABLED ? 'relative cursor-pointer' : 'relative'}>
          {profile?.profilePhoto ? (
            <img src={profile.profilePhoto} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-ink-light flex items-center justify-center text-xl text-muted">
              {profile?.name?.[0]}
            </div>
          )}
          {PHOTOS_ENABLED && (
            <input type="file" accept="image/*" hidden onChange={(e) => handlePhotoUpload(e.target.files?.[0] || null)} />
          )}
        </label>
        <div>
          <p className="text-paper font-medium">{profile?.name}</p>
          <p className="text-sm text-muted">{profile?.email}</p>
        </div>
      </div>

      {partner && (
        <div className="flex items-center gap-3 mb-8 text-sm text-muted">
          <span>Paired with</span>
          {partner.profilePhoto && <img src={partner.profilePhoto} className="w-6 h-6 rounded-full object-cover" />}
          <span className="text-paper">{partner.name}</span>
        </div>
      )}

      <div className="rounded-2xl border border-ink-border bg-ink-light/40 p-5 mb-8 space-y-4">
        <h2 className="text-sm font-medium text-paper">Couple details</h2>
        <div>
          <label className="block text-xs text-muted mb-1.5">Relationship start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-ink border border-ink-border rounded-xl px-4 py-2.5 text-paper focus:outline-none focus:border-rose"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1.5">Anniversary date</label>
          <input
            type="date"
            value={anniversary}
            onChange={(e) => setAnniversary(e.target.value)}
            className="w-full bg-ink border border-ink-border rounded-xl px-4 py-2.5 text-paper focus:outline-none focus:border-rose"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1.5">Couple quote</label>
          <input
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="A line that describes you two"
            className="w-full bg-ink border border-ink-border rounded-xl px-4 py-2.5 text-paper placeholder:text-muted focus:outline-none focus:border-rose"
          />
        </div>
        <button onClick={saveCoupleDetails} className="w-full bg-rose text-white rounded-xl py-2.5 text-sm font-medium">
          Save
        </button>
      </div>

      {stats && (
        <div className="rounded-2xl border border-ink-border bg-ink-light/40 p-5 mb-8">
          <h2 className="text-sm font-medium text-paper mb-4">Our Journey</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <Stat label="Memories" value={stats.totalMemories} />
            <Stat label="Photos" value={stats.totalPhotos} />
            <Stat label="Special" value={stats.specialMemories} />
            <Stat label="Days shared" value={stats.daysWithMemories} />
            <Stat label="This month" value={stats.memoriesThisMonth} />
            <Stat label="Photos/mo" value={stats.photosThisMonth} />
          </div>
        </div>
      )}

      <button
        onClick={logout}
        className="w-full text-sm text-muted hover:text-rose py-3 border border-ink-border rounded-xl"
      >
        Log out
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="heading-serif text-xl text-paper">{value}</p>
      <p className="text-[11px] text-muted mt-0.5">{label}</p>
    </div>
  );
}
