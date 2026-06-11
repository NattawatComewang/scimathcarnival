'use client';
import { Home, Users, Tent, CalendarRange, Layers, LogIn } from 'lucide-react';

interface Props {
  isOpen: boolean;
}

export default function MobileMenu({ isOpen }: Props) {
  return (
    <div className={`mobile-menu${isOpen ? ' open' : ''}`} id="mobile-menu">
      <a className="mobile-nav-link" href="/"><Home className="w-[18px] h-[18px]" />หน้าแรก</a>
      <a className="mobile-nav-link" href="/committee"><Users className="w-[18px] h-[18px]" />บุคลากร</a>
      <div style={{ padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', padding: '6px 16px 4px' }}>รับน้อง</div>
        <a className="mobile-nav-link" href="/event" style={{ paddingLeft: 28 }}>
          <Tent className="w-4 h-4" />รับน้อง 89
        </a>
        <a className="mobile-nav-link" href="/schedule" style={{ paddingLeft: 28 }}>
          <CalendarRange className="w-4 h-4" />กำหนดการกิจกรรม
        </a>
        <a className="mobile-nav-link" href="/activities" style={{ paddingLeft: 28 }}>
          <Layers className="w-4 h-4" />6 ฐานกิจกรรม
        </a>
      </div>
      <div className="divider" style={{ margin: '8px 0' }} />
      <a className="mobile-nav-link" href="/login"><LogIn className="w-[18px] h-[18px]" />เข้าสู่ระบบ</a>
    </div>
  );
}
