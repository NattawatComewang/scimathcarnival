'use client';
import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { Search, Briefcase, DoorOpen, Mail, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import type { Member } from './lib/types';
import { memberName, memberPhotos } from './lib/helpers';

const FALLBACK_MEMBERS: Member[] = [
  { id: 'f1', firstName: 'ชื่อจริง', lastName: 'นามสกุล', nickname: 'ชื่อเล่น', department: 'ฝ่ายวิชาการ',       position: 'หัวหน้าฝ่าย', room: 'ม.6/1', order: 1 },
  { id: 'f2', firstName: 'ชื่อจริง', lastName: 'นามสกุล', nickname: 'ชื่อเล่น', department: 'ฝ่ายวิชาการ',       position: 'กรรมการ',     room: 'ม.6/2', order: 2 },
  { id: 'f3', firstName: 'ชื่อจริง', lastName: 'นามสกุล', nickname: 'ชื่อเล่น', department: 'ฝ่ายกิจกรรม',      position: 'หัวหน้าฝ่าย', room: 'ม.6/3', order: 3 },
  { id: 'f4', firstName: 'ชื่อจริง', lastName: 'นามสกุล', nickname: 'ชื่อเล่น', department: 'ฝ่ายกิจกรรม',      position: 'กรรมการ',     room: 'ม.6/4', order: 4 },
  { id: 'f5', firstName: 'ชื่อจริง', lastName: 'นามสกุล', nickname: 'ชื่อเล่น', department: 'ฝ่ายประชาสัมพันธ์', position: 'หัวหน้าฝ่าย', room: 'ม.6/5', order: 5 },
  { id: 'f6', firstName: 'ชื่อจริง', lastName: 'นามสกุล', nickname: 'ชื่อเล่น', department: 'ฝ่ายประชาสัมพันธ์', position: 'กรรมการ',     room: 'ม.6/6', order: 6 },
];

export default function CommitteePage() {
  const [members, setMembers]       = useState<Member[]>([]);
  const [loading, setLoading]       = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [search, setSearch]         = useState('');
  const [activeDept, setActiveDept] = useState('ทั้งหมด');
  const [selected, setSelected]     = useState<Member | null>(null);
  const [photoIdx, setPhotoIdx]     = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(collection(db, 'committees'));
        if (snap.empty) {
          setMembers(FALLBACK_MEMBERS);
          setIsFallback(true);
        } else {
          const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Member));
          data.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
          setMembers(data);
        }
      } catch (_) {
        setMembers(FALLBACK_MEMBERS);
        setIsFallback(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const departments = useMemo(() => {
    const set = new Set(members.map((m) => m.department).filter(Boolean) as string[]);
    return ['ทั้งหมด', ...Array.from(set).sort()];
  }, [members]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return members.filter((m) => {
      const name = memberName(m).toLowerCase();
      const matchQ    = !q || name.includes(q) || m.nickname?.toLowerCase().includes(q) || m.position?.toLowerCase().includes(q);
      const matchDept = activeDept === 'ทั้งหมด' || m.department === activeDept;
      return matchQ && matchDept;
    });
  }, [members, search, activeDept]);

  function open(m: Member) { setSelected(m); setPhotoIdx(0); }

  const selPhotos = selected ? memberPhotos(selected) : [];

  return (
    <>
      <Nav activePage="committee" />

      <div className="page-hero committee-hero">
        <h1>กรรมการสายการเรียน</h1>
        <p>คณะกรรมการสายการเรียนวิทยาศาสตร์-คณิตศาสตร์<br />โรงเรียนเตรียมอุดมศึกษา</p>
      </div>

      <div className="filter-bar" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
        <div className="search-wrap">
          <Search className="w-[15px] h-[15px]" style={{ color: 'var(--text-3)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="ค้นหาชื่อ ตำแหน่ง..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {departments.length > 1 && (
          <div className="chip-row">
            {departments.map((dept) => (
              <button
                key={dept}
                className={`chip${activeDept === dept ? ' active' : ''}`}
                onClick={() => setActiveDept(dept)}
              >
                {dept}
              </button>
            ))}
          </div>
        )}
      </div>

      {isFallback && !loading && (
        <p style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: '0.78rem', marginBottom: 8 }}>
          ข้อมูลตัวอย่าง — รายชื่อจริงจะเปิดเผยเร็วๆ นี้
        </p>
      )}

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
          : filtered.map((m) => {
              const display = memberName(m);
              return (
                <div key={m.id} className="committee-card" onClick={() => open(m)} style={{ cursor: 'pointer' }}>
                  <div className="cm-photo-wrap">
                    {m.photoURL
                      ? <img src={m.photoURL} alt={display} className="cm-photo" />
                      : <div className="cm-initials">{getInitials(display)}</div>}
                  </div>
                  <div className="cm-info">
                    <div className="cm-name">{display}</div>
                    {m.nickname   && <div className="cm-nick">({m.nickname})</div>}
                    {m.position   && <div className="cm-position">{m.position}</div>}
                    {m.department && <div className="cm-dept">{m.department}</div>}
                  </div>
                </div>
              );
            })}
      </div>

      {selected && (
        <div className="detail-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="detail-box">
            <div className="gallery-wrap">
              <button className="detail-close" onClick={() => setSelected(null)}>
                <X className="w-[15px] h-[15px]" />
              </button>

              {selPhotos.length > 0 ? (
                <>
                  <img className="gallery-main-img" src={selPhotos[photoIdx]} alt={memberName(selected)} />
                  {selPhotos.length > 1 && (
                    <>
                      <button className="gallery-prev" onClick={() => setPhotoIdx((i) => (i - 1 + selPhotos.length) % selPhotos.length)}>
                        <ChevronLeft className="w-[18px] h-[18px]" />
                      </button>
                      <button className="gallery-next" onClick={() => setPhotoIdx((i) => (i + 1) % selPhotos.length)}>
                        <ChevronRight className="w-[18px] h-[18px]" />
                      </button>
                      <div className="gallery-dots">
                        {selPhotos.map((_, i) => (
                          <button key={i} className={`gallery-dot${i === photoIdx ? ' active' : ''}`} onClick={() => setPhotoIdx(i)} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="gallery-initials">{getInitials(memberName(selected))}</div>
              )}
            </div>

            <div className="detail-body">
              <div className="detail-name">{memberName(selected)}</div>
              {selected.nickname   && <div className="detail-nick">({selected.nickname})</div>}
              {selected.department && <div className="cm-dept" style={{ marginBottom: 10 }}>{selected.department}</div>}
              <div className="detail-meta">
                {selected.position && (
                  <div className="detail-meta-row">
                    <Briefcase className="w-3.5 h-3.5" /><span>{selected.position}</span>
                  </div>
                )}
                {selected.room && (
                  <div className="detail-meta-row">
                    <DoorOpen className="w-3.5 h-3.5" /><span>{selected.room}</span>
                  </div>
                )}
                {selected.email && (
                  <div className="detail-meta-row">
                    <Mail className="w-3.5 h-3.5" />
                    <a href={`mailto:${selected.email}`}>{selected.email}</a>
                  </div>
                )}
                {selected.instagram && (
                  <div className="detail-meta-row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                      <circle cx="12" cy="12" r="4"/>
                      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                    </svg>
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
