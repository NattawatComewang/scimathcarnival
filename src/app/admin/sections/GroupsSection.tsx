'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, getDoc, addDoc, deleteDoc, updateDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/components/Toast';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import type { Group, Student } from '../lib/types';

interface Props {
  students: Student[];
  onStudentsChanged: () => void;
}

export default function GroupsSection({ students, onStudentsChanged }: Props) {
  const { showToast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsRevealed, setGroupsRevealed] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'groups'));
        setGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Group)));
        const settingSnap = await getDoc(doc(db, 'settings', 'groups'));
        if (settingSnap.exists()) setGroupsRevealed(!!settingSnap.data().revealed);
      } catch { showToast('โหลดข้อมูลล้มเหลว', 'error'); }
    })();
  }, [showToast]);

  async function addGroup() {
    if (!newGroupName.trim()) return;
    const docRef = await addDoc(collection(db, 'groups'), { name: newGroupName.trim(), members: [] });
    setGroups((prev) => [...prev, { id: docRef.id, name: newGroupName.trim(), members: [] }]);
    setNewGroupName('');
    showToast('เพิ่มกลุ่มแล้ว');
  }

  async function deleteGroup(id: string) {
    if (!confirm('ลบกลุ่มนี้?')) return;
    await deleteDoc(doc(db, 'groups', id));
    setGroups((prev) => prev.filter((g) => g.id !== id));
    showToast('ลบกลุ่มแล้ว');
  }

  async function toggleGroupReveal() {
    const next = !groupsRevealed;
    await setDoc(doc(db, 'settings', 'groups'), { revealed: next }, { merge: true });
    setGroupsRevealed(next);
    showToast(next ? 'เปิดเผยกลุ่มแล้ว' : 'ซ่อนกลุ่มแล้ว');
  }

  async function resetGroups() {
    if (!confirm('รีเซ็ตกลุ่มทั้งหมด? นักเรียนทุกคนจะถูกถอดออกจากกลุ่ม')) return;
    for (const g of groups) {
      await updateDoc(doc(db, 'groups', g.id), { members: [] });
    }
    for (const s of students.filter((s) => s.groupId)) {
      await updateDoc(doc(db, 'students', s.id), { groupId: null });
    }
    setGroups((prev) => prev.map((g) => ({ ...g, members: [] })));
    onStudentsChanged();
    showToast('รีเซ็ตกลุ่มแล้ว');
  }

  return (
    <>
      <div className="page-title"><h2>กลุ่ม/ทีม</h2><p>{groups.length} กลุ่ม</p></div>

      <div className="d-card" style={{ marginBottom: 14 }}>
        <div className="d-card-label">การแสดงกลุ่ม</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className={`toggle ${groupsRevealed ? 'on' : ''}`} onClick={toggleGroupReveal} />
          <span style={{ fontSize: '0.9rem' }}>
            {groupsRevealed ? <><Eye className="w-[13px] h-[13px]" style={{ display: 'inline', marginRight: 4 }} />เปิดเผยกลุ่มให้นักเรียนเห็นแล้ว</> : <><EyeOff className="w-[13px] h-[13px]" style={{ display: 'inline', marginRight: 4 }} />ยังไม่เปิดเผยกลุ่ม</>}
          </span>
        </div>
      </div>

      <div className="d-card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="form-input" style={{ flex: 1 }} placeholder="ชื่อกลุ่มใหม่..." value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addGroup(); }} />
          <button className="btn btn-primary" onClick={addGroup}><Plus className="w-3.5 h-3.5" /> เพิ่มกลุ่ม</button>
        </div>
      </div>

      <div className="d-card" style={{ marginBottom: 14 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-3)' }}>
              <th style={{ textAlign: 'left', padding: '8px 6px' }}>ชื่อกลุ่ม</th>
              <th style={{ textAlign: 'left', padding: '8px 6px' }}>สมาชิก</th>
              <th style={{ padding: '8px 6px' }} />
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                <td style={{ padding: '8px 6px', fontWeight: 600 }}>{g.name}</td>
                <td style={{ padding: '8px 6px', color: 'var(--text-3)' }}>{g.members?.length ?? 0} คน</td>
                <td style={{ padding: '8px 6px', textAlign: 'right' }}>
                  <button className="btn btn-sm btn-ghost" style={{ color: 'var(--red)' }} onClick={() => deleteGroup(g.id)}><Trash2 className="w-[13px] h-[13px]" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="btn btn-sm" style={{ background: 'var(--red-dim)', color: 'var(--red)' }} onClick={resetGroups}>
        รีเซ็ตกลุ่มทั้งหมด
      </button>
    </>
  );
}
