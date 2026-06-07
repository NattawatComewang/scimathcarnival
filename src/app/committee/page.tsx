'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { Search, Briefcase, DoorOpen, Mail, X } from 'lucide-react';
import { getInitials } from '@/lib/utils';

interface Member {
  id: string;
  name: string;
  nickname?: string;
  position?: string;
  room?: string;
  email?: string;
  instagram?: string;
  bio?: string;
  photoURL?: string;
  photos?: string[];
  order?: number;
}

export default function CommitteePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Member | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(collection(db, 'committee'));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Member));
        data.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
        setMembers(data);
      } catch (_) {}
      finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return !q || m.name?.toLowerCase().includes(q) || m.position?.toLowerCase().includes(q) || m.nickname?.toLowerCase().includes(q);
  });

  return (
    <>
      <Nav activePage="committee" />

      <div className="page-hero">
        <h1>กรรมการสายการเรียน</h1>
        <p>คณะกรรมการสายการเรียนวิทยาศาสตร์-คณิตศาสตร์<br />โรงเรียนเตรียมอุดมศึกษา</p>
      </div>

      <div className="filter-bar">
        <div className="search-wrap">
          <Search style={{ width: 15, height: 15, color: 'var(--text-3)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="ค้นหาชื่อ ตำแหน่ง..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="committee-grid" id="committee-grid">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton" style={{ aspectRatio: '1/1' }} />
                <div style={{ padding: '14px 16px' }}>
                  <div className="skeleton" style={{ height: 14, width: '70%', borderRadius: 4, marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 10, width: '45%', borderRadius: 4 }} />
                </div>
              </div>
            ))
          : filtered.map((m) => (
              <div key={m.id} className="committee-card" onClick={() => setSelected(m)} style={{ cursor: 'pointer' }}>
                <div className="cm-photo-wrap">
                  {m.photoURL
                    ? <img src={m.photoURL} alt={m.name} className="cm-photo" />
                    : <div className="cm-initials">{getInitials(m.name)}</div>}
                </div>
                <div className="cm-info">
                  <div className="cm-name">{m.name}</div>
                  {m.nickname && <div className="cm-nick">({m.nickname})</div>}
                  {m.position && <div className="cm-position">{m.position}</div>}
                </div>
              </div>
            ))}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="detail-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="detail-box">
            <div className="gallery-wrap">
              <button className="detail-close" onClick={() => setSelected(null)}>
                <X style={{ width: 15, height: 15 }} />
              </button>
              {selected.photoURL
                ? <img className="gallery-main-img" src={selected.photoURL} alt={selected.name} />
                : <div className="gallery-initials">{getInitials(selected.name)}</div>}
            </div>
            <div className="detail-body">
              <div className="detail-name">{selected.name}</div>
              {selected.nickname && <div className="detail-nick">({selected.nickname})</div>}
              <div className="detail-meta">
                {selected.position && (
                  <div className="detail-meta-row">
                    <Briefcase style={{ width: 14, height: 14 }} /><span>{selected.position}</span>
                  </div>
                )}
                {selected.room && (
                  <div className="detail-meta-row">
                    <DoorOpen style={{ width: 14, height: 14 }} /><span>{selected.room}</span>
                  </div>
                )}
                {selected.email && (
                  <div className="detail-meta-row">
                    <Mail style={{ width: 14, height: 14 }} />
                    <a href={`mailto:${selected.email}`}>{selected.email}</a>
                  </div>
                )}
                {selected.instagram && (
                  <div className="detail-meta-row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
                    <a href={`https://instagram.com/${selected.instagram.replace('@', '')}`} target="_blank" rel="noreferrer">
                      {selected.instagram}
                    </a>
                  </div>
                )}
              </div>
              {selected.bio && <div className="detail-bio">{selected.bio}</div>}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
