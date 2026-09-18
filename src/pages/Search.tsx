import type { FormEvent } from 'react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePartnerProfile } from '../hooks/useCouple';
import { searchMemories } from '../firebase/firestore';
import { Memory } from '../types';
import MemoryCard from '../components/MemoryCard';
import EmptyState from '../components/EmptyState';

export default function Search() {
  const { profile, partnerId, couple } = useAuth();
  const partner = usePartnerProfile();
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<Memory[] | null>(null);
  const [searching, setSearching] = useState(false);

  async function runSearch(e: FormEvent) {
    e.preventDefault();
    if (!couple || !term.trim()) return;
    setSearching(true);
    const found = await searchMemories(couple.coupleId, term.trim());
    setResults(found);
    setSearching(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 pb-24 md:pb-12">
      <h1 className="heading-serif text-2xl text-paper mb-6">Search our story</h1>
      <form onSubmit={runSearch} className="mb-6">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search titles, entries, tags, places..."
          className="w-full bg-ink-light border border-ink-border rounded-xl px-4 py-3 text-paper placeholder:text-muted focus:outline-none focus:border-rose"
        />
      </form>

      {searching && <p className="text-sm text-muted">Searching...</p>}

      {results !== null && !searching && (
        results.length === 0 ? (
          <EmptyState emoji="🔍" title={`No memories found for "${term}"`} />
        ) : (
          <div className="space-y-4">
            {results.map((m) => (
              <MemoryCard
                key={m.memoryId}
                memory={m}
                isMine={m.authorId !== partnerId}
                authorName={m.authorId === partnerId ? partner?.name || 'Partner' : profile?.name || 'You'}
                partnerName={partner?.name}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
