'use client';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Tent, CalendarRange, Layers, LogIn, LayoutDashboard, Menu, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import MobileMenu from './MobileMenu';

type ActivePage = 'home' | 'committee' | 'event' | 'schedule' | 'activities' | 'none';

interface Props {
  activePage?: ActivePage;
}

export default function Nav({ activePage = 'none' }: Props) {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!dropdownRef.current?.contains(e.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <>
      <nav id="public-nav">
        <div className="nav-inner">
          <a className="nav-logo" href="/">
            <img src="/logo.png" className="nav-logo-img" alt="SciMath" />
            <span className="nav-logo-text">SciMath TU</span>
          </a>

          <div className="nav-links">
            <a className={`nav-link${activePage === 'home' ? ' active' : ''}`} href="/">หน้าแรก</a>
            <a className={`nav-link${activePage === 'committee' ? ' active' : ''}`} href="/committee">บุคลากร</a>

            <div
              ref={dropdownRef}
              className={`nav-dropdown${dropdownOpen ? ' open' : ''}`}
              id="nav-dd"
            >
              <button
                className="nav-link nav-dropdown-btn"
                onClick={() => setDropdownOpen((o) => !o)}
              >
                รับน้อง{' '}
                <ChevronDown className="w-[13px] h-[13px]" style={{ transition: 'transform 200ms', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }} />
              </button>
              <div className="nav-dropdown-menu">
                <a className={`nav-dropdown-item${activePage === 'event' ? ' active' : ''}`} href="/event">
                  <Tent className="w-3.5 h-3.5" />
                  รับน้อง 89
                  <span className="nav-dropdown-desc">ภาพรวมกิจกรรม CARNIVAL</span>
                </a>
                <a className={`nav-dropdown-item${activePage === 'schedule' ? ' active' : ''}`} href="/schedule">
                  <CalendarRange className="w-3.5 h-3.5" />
                  กำหนดการกิจกรรม
                  <span className="nav-dropdown-desc">ไทม์ไลน์และตารางเวลา</span>
                </a>
                <a className={`nav-dropdown-item${activePage === 'activities' ? ' active' : ''}`} href="/activities">
                  <Layers className="w-3.5 h-3.5" />
                  6 ฐานกิจกรรม
                  <span className="nav-dropdown-desc">รายละเอียดทุกฐาน</span>
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="theme-toggle" onClick={toggle} title="สลับธีม">
              <span className="icon-moon"><Moon className="w-[15px] h-[15px]" /></span>
              <span className="icon-sun"><Sun className="w-[15px] h-[15px]" /></span>
            </button>

            {user ? (
              <a className="btn btn-secondary btn-sm" href="/dashboard">
                <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
              </a>
            ) : (
              <a className="btn btn-primary btn-sm" href="/login">
                <LogIn className="w-3.5 h-3.5" /> เข้าสู่ระบบ
              </a>
            )}

            <button
              className="hamburger btn-icon"
              onClick={() => setMobileOpen((o) => !o)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <MobileMenu isOpen={mobileOpen} />
    </>
  );
}
