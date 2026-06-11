'use client';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { Calendar, Users, Clock, MapPin, Star, CalendarCheck, Megaphone } from 'lucide-react';

const TIMELINE = [
  { num: '★', label: 'เปิดลงทะเบียนน้อง', date: '4–14 มิ.ย. 2569', desc: 'น้องใหม่ทุกคนลงทะเบียนผ่านระบบออนไลน์', status: 'active', tag: 'กำลังดำเนินการ' },
  { num: '2', label: 'ประกาศกลุ่ม', date: '22 มิ.ย. 2569', desc: 'ประกาศผลการจัดกลุ่มทุกคน', status: 'future', tag: 'รอดำเนินการ' },
  { num: '3', label: 'วันงานรับน้อง — Sci-Math CARNIVAL', date: '27 มิ.ย. 2569', desc: '08.00 – 17.00 น. · โรงเรียนเตรียมอุดมศึกษา', status: 'future', tag: 'รอวันงาน' },
];

const ACTIVITIES = [
  { num: 1, name: 'Memory Booth', sub: 'ฮับบันทึกความทรงจำ' },
  { num: 2, name: 'The Game Alley', sub: 'ตรอกเกมแห่ง Carnival' },
  { num: 3, name: "The Builder's Tent", sub: 'เต็นท์ช่างฝีมือ' },
  { num: 4, name: 'The Haunted Tent', sub: 'มัมมี่ที่รัก' },
  { num: 5, name: 'The Skill Booth', sub: 'ฮับทดสอบฝีมือ' },
  { num: 6, name: 'The Grand Circus', sub: 'ละครสัตว์มหรรศจรรย์' },
];

export default function EventPage() {
  return (
    <>
      <Nav activePage="event" />

      <div className="event-page">
      {/* Hero */}
      <section className="hero-section">
        <img src="/carnival-hero.png" alt="" className="hero-bg-img" />
        <div className="hero-content">
          <div className="hero-eyebrow">
            <Star className="w-3 h-3" style={{ fill: 'var(--gold)', stroke: 'none' }} />
            กิจกรรมรับน้องสายวิทย์-คณิต รุ่น 89
          </div>
          <h1 className="hero-title">
            Sci-Math<br />
            <span className="accent">CARNIVAL</span>
          </h1>
          <div className="hero-subtitle">ยินดีต้อนรับเข้าสู่ครอบครัว SciMath TU</div>
          <p className="hero-desc">
            มาร่วมเป็นส่วนหนึ่งของงานรับน้องสุดพิเศษ<br />
            ที่เต็มไปด้วยรอยยิ้ม มิตรภาพ<br />
            และความทรงจำตลอด 3 ปีนี้
          </p>
          <div className="hero-btns">
            <a className="btn-hero-primary" href="/login">
              <CalendarCheck className="w-[18px] h-[18px]" />
              ลงทะเบียนเข้าร่วมกิจกรรม
            </a>
            <a className="btn-hero-secondary" href="/schedule">
              <Megaphone className="w-4 h-4" />
              ดูกำหนดการ
            </a>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div style={{ padding: '0 28px' }}>
        <div className="stats-bar">
          {[
            { icon: <Calendar className="w-6 h-6" />, label: 'วันงานรับน้อง', value: '27 มิ.ย. 2569' },
            { icon: <Users className="w-6 h-6" />, label: 'ผู้เข้าร่วมโดยประมาณ', value: '1,400 คน' },
            { icon: <Clock className="w-6 h-6" />, label: 'เวลา', value: '08.00 – 17.00' },
            { icon: <MapPin className="w-6 h-6" />, label: 'สถานที่', value: 'โรงเรียนเตรียมอุดมศึกษา' },
          ].map((s, i) => (
            <div key={i} className="stat-item">
              <div className="stat-icon">{s.icon}</div>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="section" style={{ paddingTop: 12 }}>
        <div className="section-header">
          <span className="section-title">ไทม์ไลน์สำคัญ</span>
        </div>
        <div className="tl-vert">
          {TIMELINE.map((item) => (
            <div key={item.num} className={`tl-item ${item.status}`}>
              <div className="tl-dot">{item.num}</div>
              <div className="tl-card">
                <div className="tl-date">{item.date}</div>
                <div className="tl-title">{item.label}</div>
                <div className="tl-desc">{item.desc}</div>
                <div className={`tl-tag ${item.status}`}>
                  <Clock className="w-2.5 h-2.5" /> {item.tag}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activities */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">กิจกรรมทั้ง 6 ฐาน</span>
        </div>
        <div className="activity-grid">
          {ACTIVITIES.map((a) => (
            <a key={a.num} className="act-card" href="/activities" style={{ textDecoration: 'none' }}>
              <div className="act-num">{a.num}</div>
              <div className="act-name">{a.name}</div>
              <div className="act-sub">{a.sub}</div>
            </a>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div className="section">
        <div className="cta-banner">
          <div className="cta-banner-icon">
            <CalendarCheck className="w-[22px] h-[22px]" style={{ color: 'white' }} />
          </div>
          <div className="cta-banner-text">
            <div className="cta-banner-title">พร้อมแล้วหรือยัง?</div>
            <div className="cta-banner-sub">ลงทะเบียนเพื่อเข้าร่วมกิจกรรมรับน้อง Sci-Math CARNIVAL 89 ได้แล้ววันนี้</div>
          </div>
          <a className="btn btn-primary" href="/register">ลงทะเบียน</a>
        </div>
      </div>
      </div>

      <Footer />
    </>
  );
}
