'use client';
import { useCallback, useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/components/Toast';
import Toggle from '@/components/Toggle';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { Announcement } from '@/lib/types';

export default function AnnouncementsSection() {
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnBody, setNewAnnBody] = useState('');
  const [newAnnPinned, setNewAnnPinned] = useState(false);

  const load = useCallback(async () => {
    try {
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setAnnouncements(snap.docs.map((d) => {
        const data = d.data();
        const ts = data.createdAt as Timestamp | null;
        return { id: d.id, title: data.title || '-', body: data.body, createdAt: ts?.toDate() ?? null, pinned: data.pinned };
      }));
    } catch { showToast('โหลดข้อมูลล้มเหลว', 'error'); }
  }, [showToast]);

  useEffect(() => { (async () => { await load(); })(); }, [load]);

  async function addAnnouncement() {
    if (!newAnnTitle.trim()) return;
    await addDoc(collection(db, 'announcements'), {
      title: newAnnTitle.trim(),
      body: newAnnBody.trim(),
      pinned: newAnnPinned,
      createdAt: serverTimestamp(),
    });
    setNewAnnTitle(''); setNewAnnBody(''); setNewAnnPinned(false);
    load();
    showToast('เพิ่มประกาศแล้ว');
  }

  async function deleteAnnouncement(id: string) {
    await deleteDoc(doc(db, 'announcements', id));
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    showToast('ลบประกาศแล้ว');
  }

  async function togglePin(id: string, cur: boolean) {
    await updateDoc(doc(db, 'announcements', id), { pinned: !cur });
    setAnnouncements((prev) => prev.map((a) => a.id === id ? { ...a, pinned: !cur } : a));
  }

  return (
    <>
      <div className="page-title"><h2>ประกาศ</h2></div>
      <div className="d-card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input className="form-input" placeholder="หัวข้อประกาศ *" value={newAnnTitle} onChange={(e) => setNewAnnTitle(e.target.value)} />
          <textarea className="form-input" rows={3} placeholder="เนื้อหาประกาศ (ไม่บังคับ)" value={newAnnBody} onChange={(e) => setNewAnnBody(e.target.value)} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
              <Toggle on={newAnnPinned} scale={0.85} onClick={() => setNewAnnPinned((p) => !p)} />
              ปักหมุด
            </label>
            <button className="btn btn-primary" onClick={addAnnouncement}><Plus className="w-3.5 h-3.5" /> เพิ่มประกาศ</button>
          </div>
        </div>
      </div>
      <div className="d-card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-3)' }}>
              <th style={{ textAlign: 'left', padding: '8px 4px' }}>หัวข้อ</th>
              <th style={{ textAlign: 'left', padding: '8px 4px' }}>วันที่</th>
              <th style={{ padding: '8px 4px' }} />
            </tr>
          </thead>
          <tbody>
            {announcements.map((a) => (
              <tr key={a.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                <td style={{ padding: '8px 4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {a.pinned && <span className="badge badge-gold" style={{ fontSize: '0.68rem' }}>📌 ปักหมุด</span>}
                    <span>{a.title}</span>
                  </div>
                  {a.body && <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 2 }}>{a.body.slice(0, 80)}{a.body.length > 80 ? '...' : ''}</div>}
                </td>
                <td style={{ padding: '8px 4px', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{a.createdAt?.toLocaleDateString('th-TH') || '-'}</td>
                <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <button className="btn btn-sm btn-ghost" title={a.pinned ? 'ถอดหมุด' : 'ปักหมุด'} onClick={() => togglePin(a.id, !!a.pinned)}>
                      {a.pinned ? <ChevronDown className="w-[13px] h-[13px]" /> : <ChevronUp className="w-[13px] h-[13px]" />}
                    </button>
                    <button className="btn btn-sm btn-ghost" style={{ color: 'var(--red)' }} onClick={() => deleteAnnouncement(a.id)}>
                      <Trash2 className="w-[13px] h-[13px]" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
