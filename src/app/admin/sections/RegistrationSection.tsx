'use client';
import { useEffect, useState } from 'react';
import { getDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/components/Toast';
import { Check } from 'lucide-react';
import type { RegSettings } from '../lib/types';

export default function RegistrationSection() {
  const { showToast } = useToast();
  const [regSettings, setRegSettings] = useState<RegSettings>({
    isOpen: false, startDate: '', endDate: '', eligibleRooms: '',
  });
  const [savingReg, setSavingReg] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'registration'));
        if (snap.exists()) {
          const d = snap.data();
          setRegSettings({
            isOpen: !!d.isOpen,
            startDate: d.startDate || '',
            endDate: d.endDate || '',
            eligibleRooms: d.eligibleRooms || '',
          });
        }
      } catch { showToast('โหลดข้อมูลล้มเหลว', 'error'); }
    })();
  }, [showToast]);

  async function saveRegSettings() {
    setSavingReg(true);
    try {
      await setDoc(doc(db, 'settings', 'registration'), regSettings);
      showToast('บันทึกการตั้งค่าแล้ว');
    } catch { showToast('บันทึกล้มเหลว', 'error'); }
    setSavingReg(false);
  }

  return (
    <>
      <div className="page-title"><h2>ตั้งค่าการลงทะเบียน</h2></div>
      <div className="d-card">
        <div className="d-card-label">สถานะการรับสมัคร</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button className={`toggle ${regSettings.isOpen ? 'on' : ''}`} onClick={() => setRegSettings((p) => ({ ...p, isOpen: !p.isOpen }))} />
          <span style={{ fontSize: '0.9rem' }}>{regSettings.isOpen ? 'เปิดรับสมัครอยู่' : 'ปิดรับสมัครแล้ว'}</span>
        </div>

        <div className="form-grid" style={{ marginBottom: 14 }}>
          <div className="form-group">
            <label className="form-label">วันเริ่มรับสมัคร</label>
            <input className="form-input" type="datetime-local" value={regSettings.startDate} onChange={(e) => setRegSettings((p) => ({ ...p, startDate: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">วันสิ้นสุด</label>
            <input className="form-input" type="datetime-local" value={regSettings.endDate} onChange={(e) => setRegSettings((p) => ({ ...p, endDate: e.target.value }))} />
          </div>
          <div className="form-group full">
            <label className="form-label">ห้องที่ลงทะเบียนได้ (คั่นด้วยจุลภาค)</label>
            <input className="form-input" placeholder="6/1, 6/2, 6/3, ..." value={regSettings.eligibleRooms} onChange={(e) => setRegSettings((p) => ({ ...p, eligibleRooms: e.target.value }))} />
            <span className="form-hint">ปล่อยว่างหากอนุญาตทุกห้อง</span>
          </div>
        </div>

        <button className="btn btn-primary" onClick={saveRegSettings} disabled={savingReg}>
          <Check className="w-3.5 h-3.5" /> {savingReg ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </div>
    </>
  );
}
