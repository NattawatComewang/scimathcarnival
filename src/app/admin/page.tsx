'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection, getDocs, addDoc, deleteDoc, doc, updateDoc,
  query, orderBy, limit, serverTimestamp, Timestamp
} from 'firebase/firestore';
import { db, auth, SUPER_ADMIN } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { useTheme } from '@/contexts/ThemeContext';
import {
  LayoutDashboard, Users, Layers, ClipboardCheck, Settings,
  UserCog, Bell, CalendarCog, Shield, FileDown, ScrollText,
  LogOut, Moon, Sun, Plus, Trash2, RefreshCw
} from 'lucide-react';

type AdminSection =
  | 'overview' | 'students' | 'groups' | 'checkin'
  | 'registration' | 'committee' | 'announcements'
  | 'event-settings' | 'staff-accounts' | 'export' | 'logs';

const NAV_ITEMS: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',       label: 'Overview',        icon: <LayoutDashboard style={{ width: 14, height: 14 }} /> },
  { id: 'students',       label: 'ข้อมูลนักเรียน',  icon: <Users style={{ width: 14, height: 14 }} /> },
  { id: 'groups',         label: 'กลุ่ม/ทีม',        icon: <Layers style={{ width: 14, height: 14 }} /> },
  { id: 'checkin',        label: 'Check-in',         icon: <ClipboardCheck style={{ width: 14, height: 14 }} /> },
  { id: 'registration',   label: 'ตั้งค่าการลงทะเบียน', icon: <Settings style={{ width: 14, height: 14 }} /> },
  { id: 'committee',      label: 'บุคลากร',           icon: <UserCog style={{ width: 14, height: 14 }} /> },
  { id: 'announcements',  label: 'ประกาศ',            icon: <Bell style={{ width: 14, height: 14 }} /> },
  { id: 'event-settings', label: 'ตั้งค่างาน',        icon: <CalendarCog style={{ width: 14, height: 14 }} /> },
  { id: 'staff-accounts', label: 'บัญชีพี่',          icon: <Shield style={{ width: 14, height: 14 }} /> },
  { id: 'export',         label: 'Export',            icon: <FileDown style={{ width: 14, height: 14 }} /> },
  { id: 'logs',           label: 'Audit Logs',        icon: <ScrollText style={{ width: 14, height: 14 }} /> },
];

interface Student { id: string; firstname?: string; lastname?: string; nickname?: string; room?: string; studentId?: string; email?: string; registered?: boolean; checkedIn?: boolean; }
interface Announcement { id: string; title: string; createdAt: Date | null; pinned?: boolean; }
interface LogEntry { id: string; action: string; detail: string; by: string; at: Date | null; }

export default function AdminPage() {
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  const { theme, toggle } = useTheme();
  const router = useRouter();

  const [section, setSection] = useState<AdminSection>('overview');
  const [students, setStudents] = useState<Student[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [counts, setCounts] = useState({ students: 0, registered: 0, checkedIn: 0 });
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [dataLoaded, setDataLoaded] = useState<Partial<Record<AdminSection, boolean>>>({});

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    if (!loading && user && user.email !== SUPER_ADMIN) {
      showToast('ไม่มีสิทธิ์เข้าถึง Admin', 'error');
      router.replace('/dashboard');
    }
  }, [user, loading, router, showToast]);

  useEffect(() => {
    if (dataLoaded[section]) return;
    loadSection(section);
  }, [section]);

  async function loadSection(sec: AdminSection) {
    try {
      if (sec === 'overview' || sec === 'students') {
        const snap = await getDocs(collection(db, 'students'));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Student));
        setStudents(data);
        setCounts({
          students: data.length,
          registered: data.filter((s) => s.registered).length,
          checkedIn: data.filter((s) => s.checkedIn).length,
        });
      }
      if (sec === 'announcements') {
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setAnnouncements(snap.docs.map((d) => {
          const data = d.data();
          const ts = data.createdAt as Timestamp | null;
          return { id: d.id, title: data.title || '-', createdAt: ts?.toDate() ?? null, pinned: data.pinned };
        }));
      }
      if (sec === 'logs') {
        const q = query(collection(db, 'auditLogs'), orderBy('at', 'desc'), limit(50));
        const snap = await getDocs(q);
        setLogs(snap.docs.map((d) => {
          const data = d.data();
          const ts = data.at as Timestamp | null;
          return { id: d.id, action: data.action, detail: data.detail, by: data.by, at: ts?.toDate() ?? null };
        }));
      }
      setDataLoaded((prev) => ({ ...prev, [sec]: true }));
    } catch (e) {
      showToast('โหลดข้อมูลล้มเหลว', 'error');
    }
  }

  async function addAnnouncement() {
    if (!newAnnTitle.trim()) return;
    await addDoc(collection(db, 'announcements'), { title: newAnnTitle.trim(), createdAt: serverTimestamp(), pinned: false });
    setNewAnnTitle('');
    setDataLoaded((p) => ({ ...p, announcements: false }));
    loadSection('announcements');
    showToast('เพิ่มประกาศแล้ว');
  }

  async function deleteAnnouncement(id: string) {
    await deleteDoc(doc(db, 'announcements', id));
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    showToast('ลบประกาศแล้ว');
  }

  async function toggleCheckin(studentId: string, current: boolean) {
    await updateDoc(doc(db, 'students', studentId), { checkedIn: !current });
    setStudents((prev) => prev.map((s) => s.id === studentId ? { ...s, checkedIn: !current } : s));
    setCounts((prev) => ({ ...prev, checkedIn: prev.checkedIn + (current ? -1 : 1) }));
  }

  if (loading || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sb-logo">
          <img src="/logo.png" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover' }} alt="logo" />
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
            <span className="icon-moon"><Moon style={{ width: 14, height: 14 }} /></span>
            <span className="icon-sun"><Sun style={{ width: 14, height: 14 }} /></span>
            {theme === 'dark' ? 'โหมดสว่าง' : 'โหมดมืด'}
          </button>
          <button className="nav-item danger" onClick={async () => { await signOut(auth); router.push('/login'); }}>
            <LogOut style={{ width: 14, height: 14 }} /> ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="admin-main">
        <div className="topbar">
          <div className="topbar-title">{NAV_ITEMS.find((n) => n.id === section)?.label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-sm btn-secondary" onClick={() => { setDataLoaded({}); loadSection(section); }}>
              <RefreshCw style={{ width: 13, height: 13 }} />
            </button>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{user.email}</span>
          </div>
        </div>

        <div style={{ padding: '20px 24px', flex: 1 }}>

          {/* ── OVERVIEW ── */}
          {section === 'overview' && (
            <>
              <div className="page-title"><h2>Overview</h2><p>ภาพรวมระบบ</p></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
                {[
                  { label: 'นักเรียนทั้งหมด', value: counts.students, color: 'var(--accent)' },
                  { label: 'ลงทะเบียนแล้ว', value: counts.registered, color: 'var(--green)' },
                  { label: 'เช็คอินแล้ว', value: counts.checkedIn, color: 'var(--blue)' },
                ].map((stat) => (
                  <div key={stat.label} className="d-card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginTop: 4 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="d-card">
                <div className="d-card-label">ลงทะเบียนล่าสุด</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-3)' }}>
                      <th style={{ textAlign: 'left', padding: '8px 4px' }}>ชื่อ</th>
                      <th style={{ textAlign: 'left', padding: '8px 4px' }}>ห้อง</th>
                      <th style={{ textAlign: 'left', padding: '8px 4px' }}>เช็คอิน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.filter((s) => s.registered).slice(0, 10).map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                        <td style={{ padding: '8px 4px' }}>{s.firstname} {s.lastname}</td>
                        <td style={{ padding: '8px 4px' }}>{s.room}</td>
                        <td style={{ padding: '8px 4px' }}>{s.checkedIn ? <span className="badge badge-green">✓</span> : <span className="badge badge-muted">-</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── STUDENTS ── */}
          {section === 'students' && (
            <>
              <div className="page-title"><h2>ข้อมูลนักเรียน</h2><p>{students.length} คน</p></div>
              <div className="d-card" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-3)' }}>
                      {['ชื่อ-นามสกุล', 'ห้อง', 'เลขประจำตัว', 'ลงทะเบียน', 'เช็คอิน'].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 6px', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                        <td style={{ padding: '8px 6px' }}>{s.firstname} {s.lastname} {s.nickname ? `(${s.nickname})` : ''}</td>
                        <td style={{ padding: '8px 6px' }}>{s.room}</td>
                        <td style={{ padding: '8px 6px' }}>{s.studentId}</td>
                        <td style={{ padding: '8px 6px' }}>{s.registered ? <span className="badge badge-green">✓</span> : <span className="badge badge-muted">-</span>}</td>
                        <td style={{ padding: '8px 6px' }}>
                          <button className={`badge ${s.checkedIn ? 'badge-green' : 'badge-muted'}`} style={{ cursor: 'pointer', border: 'none' }} onClick={() => toggleCheckin(s.id, !!s.checkedIn)}>
                            {s.checkedIn ? '✓ เช็คอิน' : 'เช็คอิน'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── ANNOUNCEMENTS ── */}
          {section === 'announcements' && (
            <>
              <div className="page-title"><h2>ประกาศ</h2></div>
              <div className="d-card" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" style={{ flex: 1 }} placeholder="หัวข้อประกาศใหม่..." value={newAnnTitle} onChange={(e) => setNewAnnTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addAnnouncement(); }} />
                  <button className="btn btn-primary" onClick={addAnnouncement}><Plus style={{ width: 14, height: 14 }} /> เพิ่ม</button>
                </div>
              </div>
              <div className="d-card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-3)' }}>
                      <th style={{ textAlign: 'left', padding: '8px 4px' }}>หัวข้อ</th>
                      <th style={{ textAlign: 'left', padding: '8px 4px' }}>วันที่</th>
                      <th style={{ padding: '8px 4px' }} />
                    </tr>
                  </thead>
                  <tbody>
                    {announcements.map((a) => (
                      <tr key={a.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                        <td style={{ padding: '8px 4px' }}>{a.title}</td>
                        <td style={{ padding: '8px 4px', color: 'var(--text-3)' }}>{a.createdAt?.toLocaleDateString('th-TH') || '-'}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                          <button className="btn btn-sm btn-ghost" style={{ color: 'var(--red)' }} onClick={() => deleteAnnouncement(a.id)}>
                            <Trash2 style={{ width: 13, height: 13 }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── LOGS ── */}
          {section === 'logs' && (
            <>
              <div className="page-title"><h2>Audit Logs</h2></div>
              <div className="d-card" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-3)' }}>
                      {['เวลา', 'ผู้ดำเนินการ', 'Action', 'รายละเอียด'].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 6px', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l) => (
                      <tr key={l.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.82rem' }}>
                        <td style={{ padding: '8px 6px', color: 'var(--text-3)' }}>{l.at?.toLocaleString('th-TH') || '-'}</td>
                        <td style={{ padding: '8px 6px' }}>{l.by}</td>
                        <td style={{ padding: '8px 6px' }}><span className="badge badge-muted">{l.action}</span></td>
                        <td style={{ padding: '8px 6px' }}>{l.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── Other sections: placeholders ── */}
          {!['overview', 'students', 'announcements', 'logs'].includes(section) && (
            <div className="d-card" style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 6 }}>
                {NAV_ITEMS.find((n) => n.id === section)?.label}
              </div>
              <div style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>ส่วนนี้อยู่ระหว่างพัฒนา</div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
