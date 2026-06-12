'use client';
import { useEffect, useState } from 'react';
import { getDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/components/Toast';
import { Check } from 'lucide-react';
import type { EventSettings } from '../lib/types';

export default function EventSettingsSection() {
  const { showToast } = useToast();
  const [eventSettings, setEventSettings] = useState<EventSettings>({
    name: '', date: '', location: '', description: '', lineUrl: '',
  });
  const [savingEvent, setSavingEvent] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'event'));
        if (snap.exists()) {
          const d = snap.data();
          setEventSettings({ name: d.name || '', date: d.date || '', location: d.location || '', description: d.description || '', lineUrl: d.lineUrl || '' });
        }
      } catch { showToast('โหลดข้อมูลล้มเหลว', 'error'); }
    })();
  }, [showToast]);

  async function saveEventSettings() {
    setSavingEvent(true);
    try {
      await setDoc(doc(db, 'settings', 'event'), eventSettings);
      showToast('บันทึกการตั้งค่าแล้ว');
    } catch { showToast('บันทึกล้มเหลว', 'error'); }
    setSavingEvent(false);
  }

  return (
    <>
      <div className="page-title"><h2>ตั้งค่างาน</h2></div>
      <div className="d-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">ชื่องาน</label>
            <input className="form-input" value={eventSettings.name} onChange={(e) => setEventSettings((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">วันที่จัดงาน</label>
              <input className="form-input" type="date" value={eventSettings.date} onChange={(e) => setEventSettings((p) => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">สถานที่</label>
              <input className="form-input" value={eventSettings.location} onChange={(e) => setEventSettings((p) => ({ ...p, location: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">รายละเอียด</label>
            <textarea className="form-input" rows={4} value={eventSettings.description} onChange={(e) => setEventSettings((p) => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">LINE Open Chat URL</label>
            <input className="form-input" type="url" placeholder="https://line.me/ti/g2/..." value={eventSettings.lineUrl ?? ''} onChange={(e) => setEventSettings((p) => ({ ...p, lineUrl: e.target.value }))} />
          </div>
          <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={saveEventSettings} disabled={savingEvent}>
            <Check className="w-3.5 h-3.5" /> {savingEvent ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </>
  );
}
