'use client';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { Clock, CalendarHeart, MapPin, Coffee, Music, Star, Layers } from 'lucide-react';

const TIMELINE = [
  { num: '★', label: 'เปิดลงทะเบียนน้อง', date: '4–14 มิ.ย. 2569', desc: 'น้องใหม่ทุกคนลงทะเบียนผ่านระบบออนไลน์', status: 'active' },
  { num: '2', label: 'ประกาศกลุ่ม', date: '22 มิ.ย. 2569', desc: 'ประกาศผลการจัดกลุ่มทุกคน', status: 'future' },
  { num: '3', label: 'วันงานรับน้อง — Sci-Math CARNIVAL', date: '27 มิ.ย. 2569', desc: '08.00 – 17.00 น. · โรงเรียนเตรียมอุดมศึกษา', status: 'future' },
];

const DAY_SCHEDULE = [
  { time: '07.30', name: 'เปิดลงทะเบียน', loc: 'จุดรับลงทะเบียน', locIcon: <MapPin className="w-[11px] h-[11px]" />, highlight: false },
  { time: '08.30', name: 'พิธีเปิดงาน', loc: null, locIcon: null, highlight: false },
  { time: '09.00 – 09.40', name: 'กิจกรรมที่ 1', loc: 'ฐานกิจกรรม', locIcon: <Layers className="w-[11px] h-[11px]" />, highlight: true },
  { time: '09.45 – 10.25', name: 'กิจกรรมที่ 2', loc: 'ฐานกิจกรรม', locIcon: <Layers className="w-[11px] h-[11px]" />, highlight: true },
  { time: '10.25 – 10.50', name: 'พักเบรก', loc: 'พื้นที่พักผ่อน', locIcon: <Coffee className="w-[11px] h-[11px]" />, highlight: false, amber: true },
  { time: '10.55 – 11.35', name: 'กิจกรรมที่ 3', loc: 'ฐานกิจกรรม', locIcon: <Layers className="w-[11px] h-[11px]" />, highlight: true },
  { time: '11.35 – 13.00', name: 'พักเที่ยง + มินิคอนเสิร์ต', loc: 'คอนเสิร์ต 12.15 – 12.45', locIcon: <Music className="w-[11px] h-[11px]" />, highlight: false },
  { time: '13.05 – 13.45', name: 'กิจกรรมที่ 4', loc: 'ฐานกิจกรรม', locIcon: <Layers className="w-[11px] h-[11px]" />, highlight: true },
  { time: '13.50 – 14.30', name: 'กิจกรรมที่ 5', loc: 'ฐานกิจกรรม', locIcon: <Layers className="w-[11px] h-[11px]" />, highlight: true },
  { time: '14.35 – 15.15', name: 'กิจกรรมที่ 6', loc: 'ฐานกิจกรรม', locIcon: <Layers className="w-[11px] h-[11px]" />, highlight: true },
  { time: '15.20 – 15.35', name: 'ปิดกิจกรรม', loc: null, locIcon: null, highlight: false },
  { time: '15.35 เป็นต้นไป', name: 'บูม + เชียร์โต้', loc: 'Grand Finale', locIcon: <Star className="w-[11px] h-[11px]" />, highlight: false, gold: true },
];

export default function SchedulePage() {
  return (
    <>
      <Nav activePage="schedule" />
      <div className="page-hero sched-hero">
        <h1>กำหนดการกิจกรรม</h1>
        <p>ไทม์ไลน์สำคัญตั้งแต่เปิดรับสมัครจนถึงวันงาน</p>
      </div>

      <div className="section sched-section" style={{ paddingTop: 0 }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>ไทม์ไลน์สำคัญ</div>
        <div className="tl-vert">
          {TIMELINE.map((item) => (
            <div key={item.num} className={`tl-item ${item.status}`}>
              <div className="tl-dot">{item.num}</div>
              <div className="tl-card">
                <div className="tl-date">{item.date}</div>
                <div className="tl-title">{item.label}</div>
                <div className="tl-desc">{item.desc}</div>
                <div className={`tl-tag ${item.status}`}>
                  <Clock className="w-2.5 h-2.5" />
                  {item.status === 'active' ? 'กำลังดำเนินการ' : 'รอดำเนินการ'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section sched-section" style={{ paddingTop: 0 }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 16, color: 'var(--text)' }}>กำหนดการวันงาน</div>
        <div className="day-card">
          <div className="day-head">
            <CalendarHeart className="w-[18px] h-[18px]" style={{ color: 'var(--accent)' }} />
            <div>
              <div className="day-head-date">27 มิถุนายน 2569</div>
              <div className="day-head-sub">วันงานรับน้อง Sci-Math CARNIVAL 89</div>
            </div>
          </div>
          {DAY_SCHEDULE.map((row, i) => (
            <div
              key={i}
              className="sched-row"
              style={row.gold ? { background: 'rgba(232,201,106,0.08)' } : row.highlight ? { background: 'var(--accent-dim)' } : undefined}
            >
              <div className="sched-dot" style={row.gold ? { background: 'var(--gold)' } : row.amber ? { background: 'var(--amber)' } : row.highlight ? { background: 'var(--accent)' } : undefined} />
              <div className="sched-time">{row.time}</div>
              <div className="sched-info">
                <div className="sched-name" style={row.gold ? { color: 'var(--gold)', fontWeight: 600 } : row.highlight ? { color: 'var(--accent)', fontWeight: 600 } : undefined}>
                  {row.name}
                </div>
                {row.loc && (
                  <div className="sched-loc">
                    {row.locIcon}{row.loc}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </>
  );
}
