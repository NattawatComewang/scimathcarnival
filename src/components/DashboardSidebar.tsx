'use client';
import { Home, Layers, Users, Calendar, QrCode, User, LogOut, Shield, Moon, Sun } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

export type DashboardSection = 'home' | 'group' | 'duo' | 'activity' | 'pass' | 'profile';

interface Props {
  activeSection: DashboardSection;
  onSectionChange: (sec: DashboardSection) => void;
  showPassEntry?: boolean;
  isAdmin?: boolean;
}

const SECTIONS: { id: DashboardSection; label: string; icon: React.ReactNode }[] = [
  { id: 'home',     label: 'หน้าหลัก',   icon: <Home style={{ width: 15, height: 15 }} /> },
  { id: 'group',    label: 'กลุ่มของฉัน', icon: <Layers style={{ width: 15, height: 15 }} /> },
  { id: 'duo',      label: 'กลุ่ม Trio',  icon: <Users style={{ width: 15, height: 15 }} /> },
  { id: 'activity', label: 'กิจกรรม',     icon: <Calendar style={{ width: 15, height: 15 }} /> },
  { id: 'profile',  label: 'โปรไฟล์',    icon: <User style={{ width: 15, height: 15 }} /> },
];

export default function DashboardSidebar({ activeSection, onSectionChange, showPassEntry, isAdmin }: Props) {
  const { user } = useAuth();
  const { toggle, theme } = useTheme();
  const router = useRouter();

  async function doLogout() {
    await signOut(auth);
    router.push('/login');
  }

  const initials = user?.displayName ? getInitials(user.displayName) : '?';

  return (
    <nav className="sidebar" id="side-nav">
      <div className="sidebar-logo">
        <img src="/logo.png" alt="logo" style={{ width: 34, height: 34, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} />
        <span className="sidebar-logo-text">SciMath TU</span>
      </div>

      <div className="sidebar-user">
        <div className="avatar avatar-sm">{initials}</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.displayName || 'โหลด...'}</div>
          <div className="sidebar-user-email">{user?.email || '...'}</div>
        </div>
      </div>

      <div className="sidebar-nav">
        {SECTIONS.filter((s) => s.id !== 'pass').map((s) => (
          <button
            key={s.id}
            className={`side-item${activeSection === s.id ? ' active' : ''}`}
            onClick={() => onSectionChange(s.id)}
          >
            {s.icon} {s.label}
          </button>
        ))}

        {showPassEntry && (
          <button
            className={`side-item${activeSection === 'pass' ? ' active' : ''}`}
            onClick={() => onSectionChange('pass')}
          >
            <QrCode style={{ width: 15, height: 15 }} /> บัตรเข้างาน
          </button>
        )}

        <div className="side-divider" />

        <button className="theme-toggle side-item" onClick={toggle} title="สลับธีม" style={{ justifyContent: 'flex-start', gap: 10 }}>
          <span className="icon-moon"><Moon style={{ width: 15, height: 15 }} /></span>
          <span className="icon-sun"><Sun style={{ width: 15, height: 15 }} /></span>
          {theme === 'dark' ? 'โหมดสว่าง' : 'โหมดมืด'}
        </button>

        {isAdmin && (
          <button className="side-item" onClick={() => router.push('/admin')} style={{ color: 'var(--amber)' }}>
            <Shield style={{ width: 15, height: 15 }} /> Admin Panel
          </button>
        )}

        <button className="side-item danger" onClick={doLogout}>
          <LogOut style={{ width: 15, height: 15 }} /> ออกจากระบบ
        </button>
      </div>
    </nav>
  );
}
