'use client';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Home, Megaphone, Calendar, Phone, Moon, Sun,
  ChevronRight, ArrowRight, Star, Clock, Check,
  MapPin, LogIn, Layers, Utensils, Music, Camera,
  Mail
} from 'lucide-react';

import type { Screen, Announcement } from './lib/types';

const BASES = [
  { num: 1, name: 'Memory Booth', sub: 'ฮับบันทึกความทรงจำ' },
  { num: 2, name: 'The Game Alley', sub: 'ตรอกเกมแห่ง Carnival' },
  { num: 3, name: "The Builder's Tent", sub: 'เต็นท์ช่างฝีมือ' },
  { num: 4, name: 'The Haunted Tent', sub: 'มัมมี่ที่รัก' },
  { num: 5, name: 'The Skill Booth', sub: 'ฮับทดสอบฝีมือ' },
  { num: 6, name: 'The Grand Circus', sub: 'ละครสัตว์มหรรศจรรย์' },
];

const TIMELINE_MAIN = [
  { label: 'ประกาศงานรับน้อง', date: '25 พ.ค. 2569', done: true },
  { label: 'รับสมัครพี่กลุ่ม พี่สวัสดิการ', date: '26 พ.ค. 2569', done: true },
  { label: 'รับสมัครพิธีกร', date: '26–28 พ.ค. 2569', done: true },
  { label: 'เปิดลงทะเบียน', date: '4–14 มิ.ย. 2569', active: true },
  { label: 'ประกาศกลุ่ม', date: '22 มิ.ย. 2569', future: true },
  { label: 'วันงานรับน้อง', date: '27 มิ.ย. 2569', future: true },
];

const DAY_SCHEDULE = [
  { time: '08.00 – 08.30', name: 'ลงทะเบียน / เช็คอิน', icon: <LogIn className="w-[11px] h-[11px]" /> },
  { time: '08.30 – 09.00', name: 'พิธีเปิด', icon: <Star className="w-[11px] h-[11px]" />, active: true },
  { time: '09.00 – 12.00', name: 'กิจกรรม 6 ฐาน รอบแรก', icon: <Layers className="w-[11px] h-[11px]" /> },
  { time: '12.00 – 13.00', name: 'พักกลางวัน', icon: <Utensils className="w-[11px] h-[11px]" /> },
  { time: '13.00 – 15.30', name: 'กิจกรรม 6 ฐาน รอบสอง', icon: <Layers className="w-[11px] h-[11px]" /> },
  { time: '15.30 – 16.30', name: 'กิจกรรมรวม / มินิคอนเสิร์ต', icon: <Music className="w-[11px] h-[11px]" /> },
  { time: '16.30 – 17.00', name: 'พิธีปิดและถ่ายรูปหมู่', icon: <Camera className="w-[11px] h-[11px]" /> },
];

export default function RubnongPage() {
  const { theme, toggle } = useTheme();
  const [screen, setScreen] = useState<Screen>('home');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(8));
    getDocs(q).then((snap) => {
      setAnnouncements(snap.docs.map((d) => {
        const data = d.data();
        const ts = data.createdAt as Timestamp | null;
        return { id: d.id, title: data.title || '-', createdAt: ts?.toDate() ?? null };
      }));
    });
  }, []);

  return (
    <div className="rubnong-page" style={{ background: 'var(--bg)', maxWidth: 430, margin: '0 auto', minHeight: '100vh', paddingBottom: 72, fontFamily: 'var(--font)' }}>
      {/* Top bar */}
      <div className="top-bar">
        <a className="top-bar-logo" href="/">
          <img src="/logo.png" alt="SciMath" className="w-7 h-7" style={{ borderRadius: 8, objectFit: 'cover' }} />
          SciMath TU
        </a>
        <button className="theme-toggle" onClick={toggle} title="สลับธีม">
          <span className="icon-moon"><Moon className="w-3.5 h-3.5" /></span>
          <span className="icon-sun"><Sun className="w-3.5 h-3.5" /></span>
        </button>
      </div>

      {/* ── HOME ── */}
      {screen === 'home' && (
        <div className="screen active">
          {/* Hero */}
          <div className="hero">
            <img src="/carnival-hero.png" alt="CARNIVAL" style={{ width: '100%', borderRadius: 'var(--radius-lg)', marginBottom: 16 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div style={{ padding: '0 4px 0' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star className="w-[11px] h-[11px]" style={{ fill: 'var(--gold)', stroke: 'none' }} /> กิจกรรมรับน้องสายวิทย์-คณิต รุ่น 89
              </div>
              <h1 style={{ fontSize: 'clamp(1.8rem,8vw,2.2rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 6 }}>
                Sci-Math<br /><span style={{ color: 'var(--accent)' }}>CARNIVAL</span>
              </h1>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', lineHeight: 1.65, marginBottom: 16 }}>
                27 มิถุนายน 2569 · โรงเรียนเตรียมอุดมศึกษา
              </p>
              <a className="btn btn-primary" href="/login" style={{ width: '100%', justifyContent: 'center' }}>
                <LogIn className="w-[15px] h-[15px]" /> ลงทะเบียนเข้าร่วมกิจกรรม
              </a>
            </div>
          </div>

          {/* Event info */}
          <div style={{ padding: '0 16px', marginBottom: 8 }}>
            <div className="d-card">
              {[
                { icon: <Calendar className="w-[18px] h-[18px]" />, label: 'วันงาน', value: '27 มิถุนายน 2569' },
                { icon: <Clock className="w-[18px] h-[18px]" />, label: 'เวลา', value: '08.00 – 17.00 น.' },
                { icon: <MapPin className="w-[18px] h-[18px]" />, label: 'สถานที่', value: 'โรงเรียนเตรียมอุดมศึกษา' },
              ].map((item, i) => (
                <div key={i} className="info-item" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ color: 'var(--accent)', flexShrink: 0 }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{item.label}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div style={{ padding: '0 16px', marginBottom: 8 }}>
            <div className="sec-div"><span>ไทม์ไลน์สำคัญ</span></div>
            <div className="tl-wrap">
              {TIMELINE_MAIN.map((item, i) => (
                <div key={i} className={`tl-row${item.done ? ' done' : item.active ? ' active' : ' future'}`}>
                  <div className="tl-icon">
                    {item.done ? <Check className="w-3 h-3" style={{ stroke: 'white', strokeWidth: 3 }} />
                      : item.active ? <Star className="w-[11px] h-[11px]" style={{ color: 'white' }} />
                      : <Clock className="w-[11px] h-[11px]" />}
                  </div>
                  <div className="tl-body">
                    <div className="tl-date">{item.date}</div>
                    <div className="tl-name">{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6 bases */}
          <div style={{ padding: '0 16px', marginBottom: 8 }}>
            <div className="sec-div"><span>กิจกรรมทั้ง 6 ฐาน</span></div>
            <div className="base-list">
              {BASES.map((b) => (
                <a key={b.num} className="base-item" href="/activities" style={{ textDecoration: 'none' }}>
                  <div className="base-num">{b.num}</div>
                  <div className="base-info">
                    <div className="base-name">{b.name}</div>
                    <div className="base-sub">{b.sub}</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick announcements */}
          <div style={{ padding: '0 16px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>ประกาศล่าสุด</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setScreen('ann')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem' }}>
                ดูทั้งหมด <ArrowRight className="w-[11px] h-[11px]" />
              </button>
            </div>
            {announcements.slice(0, 3).map((a) => (
              <div key={a.id} className="ann-item" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="ann-dot" />
                <div className="ann-text" style={{ fontSize: '0.85rem' }}>{a.title}</div>
                <ChevronRight className="w-3 h-3" style={{ color: 'var(--text-3)' }} />
              </div>
            ))}
            {announcements.length === 0 && <div style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>ยังไม่มีประกาศ</div>}
          </div>

          <div className="page-footer">© 2569 SciMath TU · All rights reserved.</div>
        </div>
      )}

      {/* ── ANNOUNCEMENTS ── */}
      {screen === 'ann' && (
        <div className="screen active">
          <div style={{ padding: '20px 16px 8px' }}><div style={{ fontSize: '1rem', fontWeight: 700 }}>ประกาศล่าสุด</div></div>
          <div style={{ padding: '0 16px' }}>
            {announcements.length === 0
              ? <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-3)', fontSize: '0.875rem' }}>ยังไม่มีประกาศ</div>
              : announcements.map((a) => (
                <div key={a.id} className="ann-item" style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div className="ann-dot" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{a.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>
                      {a.createdAt?.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) || ''}
                    </div>
                  </div>
                </div>
              ))}
          </div>
          <div className="page-footer">© 2569 SciMath TU</div>
        </div>
      )}

      {/* ── SCHEDULE ── */}
      {screen === 'schedule' && (
        <div className="screen active">
          <div style={{ padding: '20px 16px 8px' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700 }}>กำหนดการกิจกรรม</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', marginTop: 2 }}>วันงาน 27 มิ.ย. 2569</div>
          </div>
          <div className="tl-wrap" style={{ padding: '0 16px 20px' }}>
            {DAY_SCHEDULE.map((item, i) => (
              <div key={i} className={`tl-row${item.active ? ' active' : ''}`}>
                <div className="tl-icon">{item.icon}</div>
                <div className="tl-body">
                  <div className="tl-date">{item.time}</div>
                  <div className="tl-name">{item.name}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="page-footer">© 2569 SciMath TU</div>
        </div>
      )}

      {/* ── CONTACT ── */}
      {screen === 'contact' && (
        <div className="screen active">
          <div style={{ padding: '20px 16px 12px' }}><div style={{ fontSize: '1rem', fontWeight: 700 }}>ติดต่อเราได้ที่</div></div>
          <div style={{ padding: '0 16px', marginBottom: 16 }}>
            <div className="d-card">
              <div style={{ fontWeight: 600, marginBottom: 4 }}>หากมีข้อสงสัยหรือต้องการความช่วยเหลือ</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', marginBottom: 14 }}>ติดต่อฝ่ายระบบเว็บไซต์ได้ตามช่องทางด้านล่าง</div>
              {[
                { icon: <Mail className="w-[15px] h-[15px]" />, href: 'mailto:tuscimath.official@gmail.com', label: 'tuscimath.official@gmail.com' },
                { icon: <Phone className="w-[15px] h-[15px]" />, href: 'tel:022252425', label: '02-225-2425 ต่อ 508' },
              ].map((c, i) => (
                <a key={i} href={c.href} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', fontSize: '0.875rem', color: 'var(--text-2)', textDecoration: 'none', borderBottom: i === 0 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ color: 'var(--accent)' }}>{c.icon}</span>
                  {c.label}
                </a>
              ))}
            </div>
          </div>
          <div style={{ padding: '0 16px' }}>
            <a className="btn btn-primary" href="/login" style={{ width: '100%', justifyContent: 'center' }}>
              <LogIn className="w-[17px] h-[17px]" /> เข้าสู่ระบบลงทะเบียน
            </a>
          </div>
          <div className="page-footer">© 2569 SciMath TU</div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="bottom-nav">
        <div className="bottom-nav-inner">
          {([
            ['home', 'หน้าแรก', <Home className="w-5 h-5" />],
            ['ann', 'ประกาศ', <Megaphone className="w-5 h-5" />],
            ['schedule', 'กำหนดการ', <Calendar className="w-5 h-5" />],
            ['contact', 'ติดต่อเรา', <Phone className="w-5 h-5" />],
          ] as [Screen, string, React.ReactNode][]).map(([id, label, icon]) => (
            <button key={id} className={`tab-btn${screen === id ? ' active' : ''}`} onClick={() => setScreen(id)}>
              {icon}
              <span className="tab-label">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
