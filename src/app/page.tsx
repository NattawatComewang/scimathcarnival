'use client';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { CalendarHeart, Users, ChevronRight } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  createdAt: Date | null;
}

export default function HomePage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(10));
        const snap = await getDocs(q);
        setAnnouncements(snap.docs.map((d) => {
          const data = d.data();
          const ts = data.createdAt as Timestamp | null;
          return { id: d.id, title: data.title || '-', createdAt: ts?.toDate() ?? null };
        }));
      } catch (_) {
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <>
      <Nav activePage="home" />

      <section className="hero">
        <h1>สาย<span>วิทย์–คณิต</span><br />ปีการศึกษา 2569</h1>
        <p className="hero-desc">
          สายการเรียนวิทยาศาสตร์-คณิตศาสตร์<br />โรงเรียนเตรียมอุดมศึกษา
        </p>
        <div className="hero-actions">
          <a className="btn btn-primary btn-lg" href="/event">
            <CalendarHeart style={{ width: 16, height: 16 }} /> กิจกรรมรับน้อง
          </a>
          <a className="btn btn-secondary btn-lg" href="/committee">
            <Users style={{ width: 16, height: 16 }} /> บุคลากร
          </a>
        </div>
      </section>

      <section className="ann-section">
        <div className="ann-list" id="ann-list">
          {loading ? (
            <div className="ann-empty">กำลังโหลด...</div>
          ) : announcements.length === 0 ? (
            <div className="ann-empty">ยังไม่มีประกาศ</div>
          ) : announcements.map((a) => (
            <div key={a.id} className="ann-item">
              <div className="ann-dot" />
              <div className="ann-text">{a.title}</div>
              <div className="ann-date">
                {a.createdAt?.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) || ''}
              </div>
              <ChevronRight style={{ width: 14, height: 14, color: 'var(--text-3)', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}
