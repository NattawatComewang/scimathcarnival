'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/components/Toast';
import Toggle from '@/components/Toggle';
import { Plus, Trash2 } from 'lucide-react';
import type { StaffAccount } from '../lib/types';

export default function StaffAccountsSection() {
  const { showToast } = useToast();
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>([]);
  const [newStaff, setNewStaff] = useState({ email: '', name: '', role: 'STAFF' });

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'staffAccounts'));
        setStaffAccounts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StaffAccount)));
      } catch { showToast('โหลดข้อมูลล้มเหลว', 'error'); }
    })();
  }, [showToast]);

  async function addStaff() {
    if (!newStaff.email.trim()) return;
    const docRef = await addDoc(collection(db, 'staffAccounts'), { ...newStaff, active: true, createdAt: serverTimestamp() });
    setStaffAccounts((prev) => [...prev, { id: docRef.id, ...newStaff, active: true }]);
    setNewStaff({ email: '', name: '', role: 'STAFF' });
    showToast('เพิ่มบัญชีแล้ว');
  }

  async function toggleStaffActive(id: string, cur: boolean) {
    await updateDoc(doc(db, 'staffAccounts', id), { active: !cur });
    setStaffAccounts((prev) => prev.map((s) => s.id === id ? { ...s, active: !cur } : s));
  }

  async function deleteStaff(id: string) {
    if (!confirm('ลบบัญชีนี้?')) return;
    await deleteDoc(doc(db, 'staffAccounts', id));
    setStaffAccounts((prev) => prev.filter((s) => s.id !== id));
    showToast('ลบแล้ว');
  }

  return (
    <>
      <div className="page-title"><h2>บัญชีพี่</h2><p>บัญชีสิทธิ์พิเศษ</p></div>
      <div className="d-card" style={{ marginBottom: 14 }}>
        <div className="d-card-label">เพิ่มบัญชีใหม่</div>
        <div className="form-grid" style={{ marginBottom: 10 }}>
          <div className="form-group">
            <label className="form-label">อีเมล</label>
            <input className="form-input" type="email" placeholder="name@example.com" value={newStaff.email} onChange={(e) => setNewStaff((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">ชื่อ</label>
            <input className="form-input" value={newStaff.name} onChange={(e) => setNewStaff((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">สิทธิ์</label>
            <select className="form-input" value={newStaff.role} onChange={(e) => setNewStaff((p) => ({ ...p, role: e.target.value }))}>
              <option value="STAFF">STAFF</option>
              <option value="CHECKIN">CHECKIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={addStaff}><Plus className="w-3.5 h-3.5" /> เพิ่มบัญชี</button>
      </div>

      <div className="d-card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-3)' }}>
              {['ชื่อ', 'อีเมล', 'สิทธิ์', 'สถานะ', ''].map((h, i) => (
                <th key={i} style={{ textAlign: 'left', padding: '8px 6px', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staffAccounts.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                <td style={{ padding: '8px 6px' }}>{s.name}</td>
                <td style={{ padding: '8px 6px', color: 'var(--text-3)' }}>{s.email}</td>
                <td style={{ padding: '8px 6px' }}><span className="badge badge-accent">{s.role}</span></td>
                <td style={{ padding: '8px 6px' }}>
                  <Toggle on={s.active} scale={0.8} onClick={() => toggleStaffActive(s.id, s.active)} />
                </td>
                <td style={{ padding: '8px 6px', textAlign: 'right' }}>
                  <button className="btn btn-sm btn-ghost" style={{ color: 'var(--red)' }} onClick={() => deleteStaff(s.id)}>
                    <Trash2 className="w-[13px] h-[13px]" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
