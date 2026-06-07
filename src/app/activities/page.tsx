'use client';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { Users, Zap, Brain, Laugh, Target, Star } from 'lucide-react';

const ACTIVITIES = [
  {
    num: 1,
    name: 'Memory Booth',
    sub: 'ฮับบันทึกความทรงจำ',
    desc: 'บันทึกช่วงเวลาพิเศษของวันรับน้องผ่านกิจกรรมสร้างสรรค์และภาพถ่ายที่จะกลายเป็นความทรงจำสุดล้ำค่า',
    detail: 'ทำเป็นทีม · ทุกคนมีส่วนร่วม',
    icon: <Users style={{ width: 13, height: 13 }} />,
  },
  {
    num: 2,
    name: 'The Game Alley',
    sub: 'ตรอกเกมแห่ง Carnival',
    desc: 'ท้าทายทักษะและกลยุทธ์กับเกมหลากหลายรูปแบบที่ต้องอาศัยทั้งความคิดและความร่วมมือของทีม',
    detail: 'ใช้ความคิดเชิงกลยุทธ์',
    icon: <Zap style={{ width: 13, height: 13 }} />,
  },
  {
    num: 3,
    name: "The Builder's Tent",
    sub: 'เต็นท์ช่างฝีมือ',
    desc: 'ร่วมกันสร้างสรรค์และแก้ปัญหาเชิงวิศวกรรมอย่างสนุกสนาน ทดสอบความคิดสร้างสรรค์และการทำงานเป็นทีม',
    detail: 'ความคิดสร้างสรรค์ + ทักษะทีม',
    icon: <Brain style={{ width: 13, height: 13 }} />,
  },
  {
    num: 4,
    name: 'The Haunted Tent',
    sub: 'มัมมี่ที่รัก',
    desc: 'กิจกรรมพันมัมมี่สุดตลกที่ทุกคนจะได้หัวเราะและสนุกไปด้วยกัน เสริมสร้างความกล้าและมิตรภาพในทีม',
    detail: 'สนุกสนาน · เสริมความกล้า',
    icon: <Laugh style={{ width: 13, height: 13 }} />,
  },
  {
    num: 5,
    name: 'The Skill Booth',
    sub: 'ฮับทดสอบฝีมือ',
    desc: 'ทดสอบทักษะและความสามารถที่หลากหลาย ฝึกสมาธิและความแม่นยำผ่านกิจกรรมที่สนุกและท้าทาย',
    detail: 'ทักษะ · สมาธิ · ความแม่นยำ',
    icon: <Target style={{ width: 13, height: 13 }} />,
  },
  {
    num: 6,
    name: 'The Grand Circus',
    sub: 'ละครสัตว์มหรรศจรรย์',
    desc: 'ปิดท้ายด้วยกิจกรรม grand finale สุดตระการตา ที่รวบรวมทุกทีมมาโชว์ความสามารถและเฉลิมฉลองร่วมกัน',
    detail: 'Grand Finale · แสดงความสามารถ',
    icon: <Star style={{ width: 13, height: 13 }} />,
  },
];

export default function ActivitiesPage() {
  return (
    <>
      <Nav />
      <div className="page-hero">
        <h1>6 ฐานกิจกรรม</h1>
        <p>CARNIVAL 89 · สนุกสนาน สร้างมิตรภาพ และความทรงจำตลอดกาล</p>
      </div>

      <div className="section" style={{ paddingTop: 0 }}>
        <div className="act-grid">
          {ACTIVITIES.map((a, i) => (
            <div
              key={a.num}
              className="act-card"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="act-card-head">
                <div className="act-num">{a.num}</div>
                <div>
                  <div className="act-name">{a.name}</div>
                  <div className="act-sub">{a.sub}</div>
                </div>
              </div>
              <div className="act-body">
                <p className="act-desc">{a.desc}</p>
                <div className="act-detail-row">{a.icon}{a.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ background: 'var(--bg-1)', borderTop: '1px solid var(--border)', padding: 28, textAlign: 'center', color: 'var(--text-3)', fontSize: '0.8rem' }}>
        © 2569 คณะกรรมการสายการเรียนวิทย์–คณิต โรงเรียนเตรียมอุดมศึกษา
      </footer>
    </>
  );
}
