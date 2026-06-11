import { Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <a className="nav-logo" href="/">
            <img src="/logo.png" className="nav-logo-img" alt="SciMath" />
            <span className="nav-logo-text">SciMath TU</span>
          </a>
          <p>สายการเรียนวิทยาศาสตร์-คณิตศาสตร์ โรงเรียนเตรียมอุดมศึกษา</p>
          <div className="flex gap-2" style={{ marginTop: 12 }}>
            <a className="btn btn-ghost btn-icon btn-sm" href="mailto:tuscimath.official@gmail.com" title="Email">
              <Mail className="w-4 h-4" />
            </a>
            <a className="btn btn-ghost btn-icon btn-sm" href="https://instagram.com/tuscimath.official" target="_blank" rel="noreferrer" title="Instagram">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
          </div>
        </div>
        <div className="footer-col">
          <h4>ลิงก์ด่วน</h4>
          <a href="/">หน้าแรก</a>
          <a href="/committee">บุคลากร</a>
          <a href="/event">กิจกรรมรับน้อง</a>
          <a href="/login">เข้าสู่ระบบ</a>
        </div>
        <div className="footer-col">
          <h4>ติดต่อ</h4>
          <a href="mailto:tuscimath.official@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Mail className="w-[13px] h-[13px]" style={{ color: 'var(--accent)' }} />
            tuscimath.official@gmail.com
          </a>
          <a href="https://instagram.com/tuscimath.official" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="var(--accent)" stroke="none" />
            </svg>
            @tuscimath.official
          </a>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin className="w-[13px] h-[13px]" style={{ color: 'var(--accent)' }} />
            โรงเรียนเตรียมอุดมศึกษา
          </span>
        </div>
      </div>
      <div className="footer-bottom">
        © 2569 คณะกรรมการแผนการเรียนวิทยาศาสตร์-คณิตศาสตร์ ปีการศึกษา 2569
      </div>
    </footer>
  );
}
