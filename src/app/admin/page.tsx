'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth, SUPER_ADMIN } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { useTheme } from '@/contexts/ThemeContext';
import { LogOut, Moon, Sun, RefreshCw } from 'lucide-react';
import type { AdminSection, Student } from './lib/types';
import { NAV_ITEMS } from './lib/constants';
import OverviewSection from './sections/OverviewSection';
import StudentsSection from './sections/StudentsSection';
import CheckinSection from './sections/CheckinSection';
import GroupsSection from './sections/GroupsSection';
import RegistrationSection from './sections/RegistrationSection';
import CommitteeSection from './sections/CommitteeSection';
import AnnouncementsSection from './sections/AnnouncementsSection';
import EventSettingsSection from './sections/EventSettingsSection';
import StaffAccountsSection from './sections/StaffAccountsSection';
import ExportSection from './sections/ExportSection';
import LogsSection from './sections/LogsSection';

// Sections that read the shared `students` collection (loaded once in this shell).
const SECTIONS_NEEDING_STUDENTS = new Set<AdminSection>(['overview', 'students', 'checkin', 'export', 'groups']);
// Sections whose data lives entirely inside their own component (a refresh remounts them).
const STUDENT_ONLY = new Set<AdminSection>(['overview', 'students', 'checkin', 'export']);

export default function AdminPage() {
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  const { theme, toggle } = useTheme();
  const router = useRouter();

  const [section, setSection] = useState<AdminSection>('overview');
  const [nonce, setNonce] = useState(0);

  // Shared student data — used by overview / students / check-in / export / groups.
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoaded, setStudentsLoaded] = useState(false);

  const counts = useMemo(() => ({
    students: students.length,
    registered: students.filter((s) => s.registered).length,
    checkedIn: students.filter((s) => s.checkedIn).length,
  }), [students]);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    if (!loading && user && user.email !== SUPER_ADMIN) {
      showToast('ไม่มีสิทธิ์เข้าถึง Admin', 'error');
      router.replace('/dashboard');
    }
  }, [user, loading, router, showToast]);

  // ── Shared student data ───────────────────────────────────────────────────────
  const loadStudents = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'students'));
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Student)));
      setStudentsLoaded(true);
    } catch {
      showToast('โหลดข้อมูลล้มเหลว', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    if (SECTIONS_NEEDING_STUDENTS.has(section) && !studentsLoaded) {
      (async () => { await loadStudents(); })();
    }
  }, [section, studentsLoaded, loadStudents]);

  const toggleCheckin = useCallback(async (id: string, cur: boolean) => {
    await updateDoc(doc(db, 'students', id), { checkedIn: !cur });
    setStudents((prev) => prev.map((s) => s.id === id ? { ...s, checkedIn: !cur } : s));
  }, []);

  const saveStudentEdit = useCallback(async (id: string, form: Partial<Student>) => {
    await updateDoc(doc(db, 'students', id), { ...form });
    setStudents((prev) => prev.map((s) => s.id === id ? { ...s, ...form } : s));
    showToast('บันทึกแล้ว');
  }, [showToast]);

  const deleteStudent = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'students', id));
    setStudents((prev) => prev.filter((s) => s.id !== id));
    showToast('ลบแล้ว');
  }, [showToast]);

  // Refresh: reload shared students if relevant, and remount section-local data.
  function handleRefresh() {
    if (SECTIONS_NEEDING_STUDENTS.has(section)) loadStudents();
    if (!STUDENT_ONLY.has(section)) setNonce((n) => n + 1);
  }

  function renderSection() {
    switch (section) {
      case 'overview':       return <OverviewSection students={students} counts={counts} />;
      case 'students':       return <StudentsSection students={students} onToggleCheckin={toggleCheckin} onSaveEdit={saveStudentEdit} onDelete={deleteStudent} />;
      case 'checkin':        return <CheckinSection students={students} counts={counts} onToggleCheckin={toggleCheckin} />;
      case 'groups':         return <GroupsSection students={students} onStudentsChanged={loadStudents} />;
      case 'registration':   return <RegistrationSection />;
      case 'committee':      return <CommitteeSection />;
      case 'announcements':  return <AnnouncementsSection />;
      case 'event-settings': return <EventSettingsSection />;
      case 'staff-accounts': return <StaffAccountsSection />;
      case 'export':         return <ExportSection students={students} counts={counts} />;
      case 'logs':           return <LogsSection />;
    }
  }

  if (loading || !user) return null;

  return (
    <div className="admin-page" style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      {/* ── Sidebar ── */}
      <div className="sidebar">
        <div className="sb-logo">
          <img src="/logo.png" className="w-[34px] h-[34px]" style={{ borderRadius: 8, objectFit: 'cover' }} alt="logo" />
          <span className="sb-logo-text">Admin</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
          <div className="nav-grp">
            <div className="nav-grp-lbl">จัดการ</div>
            {NAV_ITEMS.slice(0, 5).map((item) => (
              <button key={item.id} className={`nav-item${section === item.id ? ' active' : ''}`} onClick={() => setSection(item.id)}>
                {item.icon} {item.label}
              </button>
            ))}
          </div>
          <div className="nav-grp">
            <div className="nav-grp-lbl">เนื้อหา</div>
            {NAV_ITEMS.slice(5, 9).map((item) => (
              <button key={item.id} className={`nav-item${section === item.id ? ' active' : ''}`} onClick={() => setSection(item.id)}>
                {item.icon} {item.label}
              </button>
            ))}
          </div>
          <div className="nav-grp">
            <div className="nav-grp-lbl">ระบบ</div>
            {NAV_ITEMS.slice(9).map((item) => (
              <button key={item.id} className={`nav-item${section === item.id ? ' active' : ''}`} onClick={() => setSection(item.id)}>
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sb-footer">
          <button className="nav-item" onClick={toggle}>
            <span className="icon-moon"><Moon className="w-3.5 h-3.5" /></span>
            <span className="icon-sun"><Sun className="w-3.5 h-3.5" /></span>
            {theme === 'dark' ? 'โหมดสว่าง' : 'โหมดมืด'}
          </button>
          <button className="nav-item danger" onClick={async () => { await signOut(auth); router.push('/login'); }}>
            <LogOut className="w-3.5 h-3.5" /> ออกจากระบบ
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="admin-main">
        <div className="topbar">
          <div className="topbar-title">{NAV_ITEMS.find((n) => n.id === section)?.label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-sm btn-secondary" onClick={handleRefresh}>
              <RefreshCw className="w-[13px] h-[13px]" />
            </button>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{user.email}</span>
          </div>
        </div>

        <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>
          <div key={`${section}:${nonce}`}>
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
}
