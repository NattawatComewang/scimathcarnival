import type { TimelineItem, ActivityItem } from './types';

export const TIMELINE: TimelineItem[] = [
  { num: '★', label: 'เปิดลงทะเบียนน้อง', date: '4–14 มิ.ย. 2569', desc: 'น้องใหม่ทุกคนลงทะเบียนผ่านระบบออนไลน์', status: 'active', tag: 'กำลังดำเนินการ' },
  { num: '2', label: 'ประกาศกลุ่ม', date: '22 มิ.ย. 2569', desc: 'ประกาศผลการจัดกลุ่มทุกคน', status: 'future', tag: 'รอดำเนินการ' },
  { num: '3', label: 'วันงานรับน้อง — Sci-Math CARNIVAL', date: '27 มิ.ย. 2569', desc: '08.00 – 17.00 น. · โรงเรียนเตรียมอุดมศึกษา', status: 'future', tag: 'รอวันงาน' },
];

export const ACTIVITIES: ActivityItem[] = [
  { num: 1, name: 'Memory Booth', sub: 'ฮับบันทึกความทรงจำ' },
  { num: 2, name: 'The Game Alley', sub: 'ตรอกเกมแห่ง Carnival' },
  { num: 3, name: "The Builder's Tent", sub: 'เต็นท์ช่างฝีมือ' },
  { num: 4, name: 'The Haunted Tent', sub: 'มัมมี่ที่รัก' },
  { num: 5, name: 'The Skill Booth', sub: 'ฮับทดสอบฝีมือ' },
  { num: 6, name: 'The Grand Circus', sub: 'ละครสัตว์มหรรศจรรย์' },
];
