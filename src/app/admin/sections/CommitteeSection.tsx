'use client';
import { useEffect, useRef, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useToast } from '@/components/Toast';
import { Plus, Trash2, Edit3, X } from 'lucide-react';
import type { CommitteeMember } from '../lib/types';

const EMPTY_MEMBER: Partial<CommitteeMember> = {
  firstName: '', lastName: '', nickname: '', department: '',
  position: '', room: '', email: '', instagram: '', bio: '', order: 0,
};

export default function CommitteeSection() {
  const { showToast } = useToast();
  const [committeeList, setCommitteeList] = useState<CommitteeMember[]>([]);
  const [memberForm, setMemberForm] = useState<Partial<CommitteeMember>>(EMPTY_MEMBER);
  const [editingMember, setEditingMember] = useState<CommitteeMember | null>(null);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'committees'));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CommitteeMember));
        data.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
        setCommitteeList(data);
      } catch { showToast('โหลดข้อมูลล้มเหลว', 'error'); }
    })();
  }, [showToast]);

  function openNewMember() { setMemberForm(EMPTY_MEMBER); setEditingMember(null); setPhotoFile(null); setShowMemberForm(true); }
  function openEditMember(m: CommitteeMember) { setMemberForm({ ...m }); setEditingMember(m); setPhotoFile(null); setShowMemberForm(true); }
  function closeMemberForm() { setShowMemberForm(false); setEditingMember(null); setMemberForm(EMPTY_MEMBER); }

  async function saveMember() {
    setPhotoUploading(true);
    try {
      let photoURL = memberForm.photoURL || '';
      if (photoFile) {
        const storRef = ref(storage, `committees/${editingMember?.id ?? Date.now()}/${photoFile.name}`);
        await uploadBytes(storRef, photoFile);
        photoURL = await getDownloadURL(storRef);
      }
      const payload = { ...memberForm, photoURL };
      if (editingMember) {
        await updateDoc(doc(db, 'committees', editingMember.id), payload);
        setCommitteeList((prev) => prev.map((m) => m.id === editingMember.id ? { ...m, ...payload } : m));
        showToast('บันทึกแล้ว');
      } else {
        const docRef = await addDoc(collection(db, 'committees'), { ...payload, createdAt: serverTimestamp() });
        setCommitteeList((prev) => [...prev, { id: docRef.id, ...payload } as CommitteeMember]);
        showToast('เพิ่มบุคลากรแล้ว');
      }
      closeMemberForm();
    } catch { showToast('บันทึกล้มเหลว', 'error'); }
    setPhotoUploading(false);
  }

  async function deleteMember(id: string) {
    if (!confirm('ลบบุคลากรคนนี้?')) return;
    await deleteDoc(doc(db, 'committees', id));
    setCommitteeList((prev) => prev.filter((m) => m.id !== id));
    showToast('ลบแล้ว');
  }

  return (
    <>
      <div className="page-title" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div><h2>บุคลากร</h2><p>{committeeList.length} คน</p></div>
        <button className="btn btn-primary btn-sm" onClick={openNewMember}><Plus className="w-3.5 h-3.5" /> เพิ่ม</button>
      </div>

      {/* Member form */}
      {showMemberForm && (
        <div className="d-card" style={{ marginBottom: 16, borderColor: 'var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontWeight: 600 }}>{editingMember ? 'แก้ไขบุคลากร' : 'เพิ่มบุคลากรใหม่'}</div>
            <button onClick={closeMemberForm}><X className="w-[15px] h-[15px]" style={{ color: 'var(--text-3)' }} /></button>
          </div>
          <div className="form-grid">
            {([['firstName', 'ชื่อ'], ['lastName', 'นามสกุล'], ['nickname', 'ชื่อเล่น'], ['department', 'ฝ่าย/กลุ่ม'], ['position', 'ตำแหน่ง'], ['room', 'ห้อง'], ['email', 'อีเมล'], ['instagram', 'Instagram']] as [keyof CommitteeMember, string][]).map(([k, l]) => (
              <div key={k} className="form-group">
                <label className="form-label">{l}</label>
                <input className="form-input" value={(memberForm[k] as string) ?? ''} onChange={(e) => setMemberForm((p) => ({ ...p, [k]: e.target.value }))} />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">ลำดับ</label>
              <input className="form-input" type="number" value={memberForm.order ?? 0} onChange={(e) => setMemberForm((p) => ({ ...p, order: Number(e.target.value) }))} />
            </div>
            <div className="form-group full">
              <label className="form-label">Bio</label>
              <textarea className="form-input" rows={3} value={memberForm.bio ?? ''} onChange={(e) => setMemberForm((p) => ({ ...p, bio: e.target.value }))} />
            </div>
            <div className="form-group full">
              <label className="form-label">รูปภาพ</label>
              <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="btn btn-sm btn-secondary" onClick={() => photoInputRef.current?.click()}>เลือกรูป</button>
                {photoFile && <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>{photoFile.name}</span>}
                {!photoFile && memberForm.photoURL && <img src={memberForm.photoURL} className="w-10 h-10" style={{ objectFit: 'cover', borderRadius: 6 }} alt="" />}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={closeMemberForm}>ยกเลิก</button>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={saveMember} disabled={photoUploading}>
              {photoUploading ? 'กำลังอัปโหลด...' : 'บันทึก'}
            </button>
          </div>
        </div>
      )}

      <div className="d-card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-3)' }}>
              {['#', 'ชื่อ-นามสกุล', 'ฝ่าย', 'ตำแหน่ง', 'ห้อง', ''].map((h, i) => (
                <th key={i} style={{ textAlign: 'left', padding: '8px 6px', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {committeeList.map((m) => (
              <tr key={m.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                <td style={{ padding: '8px 6px', color: 'var(--text-3)' }}>{m.order ?? '-'}</td>
                <td style={{ padding: '8px 6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {m.photoURL && <img src={m.photoURL} className="w-7 h-7" style={{ borderRadius: '50%', objectFit: 'cover' }} alt="" />}
                    <span>{m.firstName} {m.lastName} {m.nickname ? `(${m.nickname})` : ''}</span>
                  </div>
                </td>
                <td style={{ padding: '8px 6px' }}>{m.department}</td>
                <td style={{ padding: '8px 6px' }}>{m.position}</td>
                <td style={{ padding: '8px 6px' }}>{m.room}</td>
                <td style={{ padding: '8px 6px', textAlign: 'right', display: 'flex', gap: 4 }}>
                  <button className="btn btn-sm btn-ghost" onClick={() => openEditMember(m)}><Edit3 className="w-[13px] h-[13px]" /></button>
                  <button className="btn btn-sm btn-ghost" style={{ color: 'var(--red)' }} onClick={() => deleteMember(m.id)}><Trash2 className="w-[13px] h-[13px]" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
