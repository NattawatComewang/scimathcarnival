'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc, setDoc,
  query, orderBy, limit, serverTimestamp, Timestamp, where,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage, SUPER_ADMIN } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { useTheme } from '@/contexts/ThemeContext';
import {
  LayoutDashboard, Users, Layers, ClipboardCheck, Settings,
  UserCog, Bell, CalendarCog, Shield, FileDown, ScrollText,
  LogOut, Moon, Sun, Plus, Trash2, RefreshCw, Search, X,
  Eye, EyeOff, Edit3, Check, ChevronDown, ChevronUp,
} from 'lucide-react';

type AdminSection =
  | 'overview' | 'students' | 'groups' | 'checkin'
  | 'registration' | 'committee' | 'announcements'
  | 'event-settings' | 'staff-accounts' | 'export' | 'logs';

const NAV_ITEMS: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',       label: 'Overview',            icon: <LayoutDashboard style={{ width: 14, height: 14 }} /> },
  { id: 'students',       label: 'ข้อมูลนักเรียน',      icon: <Users style={{ width: 14, height: 14 }} /> },
  { id: 'groups',         label: 'กลุ่ม/ทีม',            icon: <Layers style={{ width: 14, height: 14 }} /> },
  { id: 'checkin',        label: 'Check-in',             icon: <ClipboardCheck style={{ width: 14, height: 14 }} /> },
  { id: 'registration',   label: 'ตั้งค่าการลงทะเบียน', icon: <Settings style={{ width: 14, height: 14 }} /> },
  { id: 'committee',      label: 'บุคลากร',              icon: <UserCog style={{ width: 14, height: 14 }} /> },
  { id: 'announcements',  label: 'ประกาศ',               icon: <Bell style={{ width: 14, height: 14 }} /> },
  { id: 'event-settings', label: 'ตั้งค่างาน',           icon: <CalendarCog style={{ width: 14, height: 14 }} /> },
  { id: 'staff-accounts', label: 'บัญชีพี่',             icon: <Shield style={{ width: 14, height: 14 }} /> },
  { id: 'export',         label: 'Export',               icon: <FileDown style={{ width: 14, height: 14 }} /> },
  { id: 'logs',           label: 'Audit Logs',           icon: <ScrollText style={{ width: 14, height: 14 }} /> },
];

// ── Interfaces ────────────────────────────────────────────────────────────────
interface Student {
  id: string;
  firstname?: string; lastname?: string; nickname?: string;
  room?: string; studentId?: string; email?: string;
  phone?: string; lineId?: string; instagram?: string;
  allergies?: string; healthNote?: string;
  emergencyName?: string; emergencyPhone?: string; emergencyRelation?: string;
  registered?: boolean; checkedIn?: boolean; groupId?: string;
}
interface Announcement {
  id: string; title: string; body?: string; createdAt: Date | null; pinned?: boolean;
}
interface LogEntry {
  id: string; action: string; detail: string; by: string; at: Date | null;
}
interface Group {
  id: string; name: string; members: string[]; color?: string;
}
interface CommitteeMember {
  id: string;
  firstName?: string; lastName?: string; nickname?: string;
  department?: string; position?: string; room?: string;
  email?: string; instagram?: string; bio?: string;
  photoURL?: string; photos?: string[]; order?: number;
}
interface RegSettings {
  isOpen: boolean; startDate: string; endDate: string; eligibleRooms: string;
}
interface EventSettings {
  name: string; date: string; location: string; description: string; lineUrl?: string;
}
interface StaffAccount {
  id: string; email: string; name: string; role: string; active: boolean;
}

const EMPTY_MEMBER: Partial<CommitteeMember> = {
  firstName: '', lastName: '', nickname: '', department: '',
  position: '', room: '', email: '', instagram: '', bio: '', order: 0,
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  const { theme, toggle } = useTheme();
  const router = useRouter();

  const [section, setSection]     = useState<AdminSection>('overview');
  const [dataLoaded, setDataLoaded] = useState<Partial<Record<AdminSection, boolean>>>({});

  // Overview / students
  const [students, setStudents]   = useState<Student[]>([]);
  const [counts, setCounts]       = useState({ students: 0, registered: 0, checkedIn: 0 });
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editStudentForm, setEditStudentForm] = useState<Partial<Student>>({});
  const [editingStudent, setEditingStudent] = useState(false);

  // Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnTitle, setNewAnnTitle]   = useState('');
  const [newAnnBody, setNewAnnBody]     = useState('');
  const [newAnnPinned, setNewAnnPinned] = useState(false);

  // Logs
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Groups
  const [groups, setGroups]           = useState<Group[]>([]);
  const [groupsRevealed, setGroupsRevealed] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Check-in
  const [ciSearch, setCiSearch] = useState('');

  // Registration settings
  const [regSettings, setRegSettings] = useState<RegSettings>({
    isOpen: false, startDate: '', endDate: '', eligibleRooms: '',
  });
  const [savingReg, setSavingReg] = useState(false);

  // Committee
  const [committeeList, setCommitteeList]     = useState<CommitteeMember[]>([]);
  const [memberForm, setMemberForm]           = useState<Partial<CommitteeMember>>(EMPTY_MEMBER);
  const [editingMember, setEditingMember]     = useState<CommitteeMember | null>(null);
  const [showMemberForm, setShowMemberForm]   = useState(false);
  const [photoFile, setPhotoFile]             = useState<File | null>(null);
  const [photoUploading, setPhotoUploading]   = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Event settings
  const [eventSettings, setEventSettings] = useState<EventSettings>({
    name: '', date: '', location: '', description: '', lineUrl: '',
  });
  const [savingEvent, setSavingEvent] = useState(false);

  // Staff accounts
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>([]);
  const [newStaff, setNewStaff] = useState({ email: '', name: '', role: 'STAFF' });

  // Export
  const [exportLoading, setExportLoading] = useState(false);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    if (!loading && user && user.email !== SUPER_ADMIN) {
      showToast('ไม่มีสิทธิ์เข้าถึง Admin', 'error');
      router.replace('/dashboard');
    }
  }, [user, loading, router, showToast]);

  // ── Data loaders ────────────────────────────────────────────────────────────
  const loadSection = useCallback(async (sec: AdminSection) => {
    try {
      if (sec === 'overview' || sec === 'students' || sec === 'checkin' || sec === 'export') {
        const snap = await getDocs(collection(db, 'students'));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Student));
        setStudents(data);
        setCounts({
          students:  data.length,
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
          return { id: d.id, title: data.title || '-', body: data.body, createdAt: ts?.toDate() ?? null, pinned: data.pinned };
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
      if (sec === 'groups') {
        const snap = await getDocs(collection(db, 'groups'));
        setGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Group)));
        const settingSnap = await getDoc(doc(db, 'settings', 'groups'));
        if (settingSnap.exists()) setGroupsRevealed(!!settingSnap.data().revealed);
      }
      if (sec === 'registration') {
        const snap = await getDoc(doc(db, 'settings', 'registration'));
        if (snap.exists()) {
          const d = snap.data();
          setRegSettings({
            isOpen: !!d.isOpen,
            startDate: d.startDate || '',
            endDate: d.endDate || '',
            eligibleRooms: d.eligibleRooms || '',
          });
        }
      }
      if (sec === 'committee') {
        const snap = await getDocs(collection(db, 'committees'));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CommitteeMember));
        data.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
        setCommitteeList(data);
      }
      if (sec === 'event-settings') {
        const snap = await getDoc(doc(db, 'settings', 'event'));
        if (snap.exists()) {
          const d = snap.data();
          setEventSettings({ name: d.name || '', date: d.date || '', location: d.location || '', description: d.description || '', lineUrl: d.lineUrl || '' });
        }
      }
      if (sec === 'staff-accounts') {
        const snap = await getDocs(collection(db, 'staffAccounts'));
        setStaffAccounts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StaffAccount)));
      }

      setDataLoaded((prev) => ({ ...prev, [sec]: true }));
    } catch (_) {
      showToast('โหลดข้อมูลล้มเหลว', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    if (dataLoaded[section]) return;
    loadSection(section);
  }, [section, loadSection, dataLoaded]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function markDirty(sec: AdminSection) {
    setDataLoaded((p) => ({ ...p, [sec]: false }));
  }

  // ── Students ─────────────────────────────────────────────────────────────────
  async function toggleCheckin(id: string, cur: boolean) {
    await updateDoc(doc(db, 'students', id), { checkedIn: !cur });
    setStudents((prev) => prev.map((s) => s.id === id ? { ...s, checkedIn: !cur } : s));
    setCounts((prev) => ({ ...prev, checkedIn: prev.checkedIn + (cur ? -1 : 1) }));
  }

  async function saveStudentEdit() {
    if (!selectedStudent) return;
    await updateDoc(doc(db, 'students', selectedStudent.id), { ...editStudentForm });
    setStudents((prev) => prev.map((s) => s.id === selectedStudent.id ? { ...s, ...editStudentForm } : s));
    setSelectedStudent((s) => s ? { ...s, ...editStudentForm } : s);
    setEditingStudent(false);
    showToast('บันทึกแล้ว');
  }

  async function deleteStudent(id: string) {
    if (!confirm('ลบนักเรียนคนนี้? ไม่สามารถย้อนกลับได้')) return;
    await deleteDoc(doc(db, 'students', id));
    setStudents((prev) => prev.filter((s) => s.id !== id));
    if (selectedStudent?.id === id) setSelectedStudent(null);
    setCounts((prev) => ({ ...prev, students: prev.students - 1 }));
    showToast('ลบแล้ว');
  }

  // ── Announcements ────────────────────────────────────────────────────────────
  async function addAnnouncement() {
    if (!newAnnTitle.trim()) return;
    await addDoc(collection(db, 'announcements'), {
      title: newAnnTitle.trim(),
      body: newAnnBody.trim(),
      pinned: newAnnPinned,
      createdAt: serverTimestamp(),
    });
    setNewAnnTitle(''); setNewAnnBody(''); setNewAnnPinned(false);
    markDirty('announcements');
    loadSection('announcements');
    showToast('เพิ่มประกาศแล้ว');
  }

  async function deleteAnnouncement(id: string) {
    await deleteDoc(doc(db, 'announcements', id));
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    showToast('ลบประกาศแล้ว');
  }

  async function togglePin(id: string, cur: boolean) {
    await updateDoc(doc(db, 'announcements', id), { pinned: !cur });
    setAnnouncements((prev) => prev.map((a) => a.id === id ? { ...a, pinned: !cur } : a));
  }

  // ── Groups ───────────────────────────────────────────────────────────────────
  async function addGroup() {
    if (!newGroupName.trim()) return;
    const docRef = await addDoc(collection(db, 'groups'), { name: newGroupName.trim(), members: [] });
    setGroups((prev) => [...prev, { id: docRef.id, name: newGroupName.trim(), members: [] }]);
    setNewGroupName('');
    showToast('เพิ่มกลุ่มแล้ว');
  }

  async function deleteGroup(id: string) {
    if (!confirm('ลบกลุ่มนี้?')) return;
    await deleteDoc(doc(db, 'groups', id));
    setGroups((prev) => prev.filter((g) => g.id !== id));
    showToast('ลบกลุ่มแล้ว');
  }

  async function toggleGroupReveal() {
    const next = !groupsRevealed;
    await setDoc(doc(db, 'settings', 'groups'), { revealed: next }, { merge: true });
    setGroupsRevealed(next);
    showToast(next ? 'เปิดเผยกลุ่มแล้ว' : 'ซ่อนกลุ่มแล้ว');
  }

  async function resetGroups() {
    if (!confirm('รีเซ็ตกลุ่มทั้งหมด? นักเรียนทุกคนจะถูกถอดออกจากกลุ่ม')) return;
    for (const g of groups) {
      await updateDoc(doc(db, 'groups', g.id), { members: [] });
    }
    const batch = students.filter((s) => s.groupId);
    for (const s of batch) {
      await updateDoc(doc(db, 'students', s.id), { groupId: null });
    }
    markDirty('groups'); markDirty('students');
    loadSection('groups');
    showToast('รีเซ็ตกลุ่มแล้ว');
  }

  // ── Registration settings ────────────────────────────────────────────────────
  async function saveRegSettings() {
    setSavingReg(true);
    try {
      await setDoc(doc(db, 'settings', 'registration'), regSettings);
      showToast('บันทึกการตั้งค่าแล้ว');
    } catch (_) { showToast('บันทึกล้มเหลว', 'error'); }
    setSavingReg(false);
  }

  // ── Committee ─────────────────────────────────────────────────────────────────
  function openNewMember()         { setMemberForm(EMPTY_MEMBER); setEditingMember(null); setPhotoFile(null); setShowMemberForm(true); }
  function openEditMember(m: CommitteeMember) { setMemberForm({ ...m }); setEditingMember(m); setPhotoFile(null); setShowMemberForm(true); }
  function closeMemberForm()        { setShowMemberForm(false); setEditingMember(null); setMemberForm(EMPTY_MEMBER); }

  async function saveMember() {
    setPhotoUploading(true);
    try {
      let photoURL = memberForm.photoURL || '';
      if (photoFile) {
        const storRef = ref(storage, `committees/${editingMember?.id ?? Date.now()}/${photoFile.name}`);
        await uploadBytes(storRef, photoFile);
        photoURL = await getDownloadURL(storRef);
      }
      const payload = { ...memberForm, photoURL };
      if (editingMember) {
        await updateDoc(doc(db, 'committees', editingMember.id), payload);
        setCommitteeList((prev) => prev.map((m) => m.id === editingMember.id ? { ...m, ...payload } : m));
        showToast('บันทึกแล้ว');
      } else {
        const docRef = await addDoc(collection(db, 'committees'), { ...payload, createdAt: serverTimestamp() });
        setCommitteeList((prev) => [...prev, { id: docRef.id, ...payload } as CommitteeMember]);
        showToast('เพิ่มบุคลากรแล้ว');
      }
      closeMemberForm();
    } catch (_) { showToast('บันทึกล้มเหลว', 'error'); }
    setPhotoUploading(false);
  }

  async function deleteMember(id: string) {
    if (!confirm('ลบบุคลากรคนนี้?')) return;
    await deleteDoc(doc(db, 'committees', id));
    setCommitteeList((prev) => prev.filter((m) => m.id !== id));
    showToast('ลบแล้ว');
  }

  // ── Event settings ────────────────────────────────────────────────────────────
  async function saveEventSettings() {
    setSavingEvent(true);
    try {
      await setDoc(doc(db, 'settings', 'event'), eventSettings);
      showToast('บันทึกการตั้งค่าแล้ว');
    } catch (_) { showToast('บันทึกล้มเหลว', 'error'); }
    setSavingEvent(false);
  }

  // ── Staff accounts ────────────────────────────────────────────────────────────
  async function addStaff() {
    if (!newStaff.email.trim()) return;
    const docRef = await addDoc(collection(db, 'staffAccounts'), { ...newStaff, active: true, createdAt: serverTimestamp() });
    setStaffAccounts((prev) => [...prev, { id: docRef.id, ...newStaff, active: true }]);
    setNewStaff({ email: '', name: '', role: 'STAFF' });
    showToast('เพิ่มบัญชีแล้ว');
  }

  async function toggleStaffActive(id: string, cur: boolean) {
    await updateDoc(doc(db, 'staffAccounts', id), { active: !cur });
    setStaffAccounts((prev) => prev.map((s) => s.id === id ? { ...s, active: !cur } : s));
  }

  async function deleteStaff(id: string) {
    if (!confirm('ลบบัญชีนี้?')) return;
    await deleteDoc(doc(db, 'staffAccounts', id));
    setStaffAccounts((prev) => prev.filter((s) => s.id !== id));
    showToast('ลบแล้ว');
  }

  // ── Export ────────────────────────────────────────────────────────────────────
  function exportCSV() {
    setExportLoading(true);
    const headers = ['ชื่อ', 'นามสกุล', 'ชื่อเล่น', 'ห้อง', 'เลขประจำตัว', 'อีเมล', 'เบอร์โทร', 'ลงทะเบียน', 'เช็คอิน'];
    const rows = students.map((s) => [
      s.firstname ?? '', s.lastname ?? '', s.nickname ?? '',
      s.room ?? '', s.studentId ?? '', s.email ?? '', s.phone ?? '',
      s.registered ? 'ใช่' : 'ไม่', s.checkedIn ? 'ใช่' : 'ไม่',
    ]);
    const bom = '﻿';
    const csv = bom + [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'students.csv'; a.click();
    URL.revokeObjectURL(url);
    setExportLoading(false);
    showToast('ดาวน์โหลดแล้ว');
  }

  if (loading || !user) return null;

  // ── Derived ───────────────────────────────────────────────────────────────────
  const ciStudents = students.filter((s) => {
    const q = ciSearch.toLowerCase();
    if (!q) return true;
    return (
      `${s.firstname} ${s.lastname}`.toLowerCase().includes(q) ||
      s.nickname?.toLowerCase().includes(q) ||
      s.room?.toLowerCase().includes(q) ||
      s.studentId?.includes(q)
    );
  });

  const filteredStudents = students.filter((s) => {
    const q = studentSearch.toLowerCase();
    if (!q) return true;
    return (
      `${s.firstname} ${s.lastname}`.toLowerCase().includes(q) ||
      s.nickname?.toLowerCase().includes(q) ||
      s.room?.toLowerCase().includes(q) ||
      s.studentId?.includes(q)
    );
  });

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="admin-page" style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      {/* ── Sidebar ── */}
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

      {/* ── Main content ── */}
      <div className="admin-main">
        <div className="topbar">
          <div className="topbar-title">{NAV_ITEMS.find((n) => n.id === section)?.label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-sm btn-secondary" onClick={() => { markDirty(section); loadSection(section); }}>
              <RefreshCw style={{ width: 13, height: 13 }} />
            </button>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{user.email}</span>
          </div>
        </div>

        <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>

          {/* ══ OVERVIEW ══ */}
          {section === 'overview' && (
            <>
              <div className="page-title"><h2>Overview</h2><p>ภาพรวมระบบ</p></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
                {[
                  { label: 'นักเรียนทั้งหมด', value: counts.students,   color: 'var(--accent)' },
                  { label: 'ลงทะเบียนแล้ว',   value: counts.registered, color: 'var(--green)' },
                  { label: 'เช็คอินแล้ว',      value: counts.checkedIn,  color: 'var(--blue)' },
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
                        <td style={{ padding: '8px 4px' }}>
                          {s.checkedIn ? <span className="badge badge-green">✓</span> : <span className="badge badge-muted">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ══ STUDENTS ══ */}
          {section === 'students' && (
            <>
              <div className="page-title"><h2>ข้อมูลนักเรียน</h2><p>{students.length} คน</p></div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
                  <Search style={{ width: 14, height: 14, color: 'var(--text-3)', flexShrink: 0 }} />
                  <input style={{ border: 'none', background: 'none', outline: 'none', color: 'var(--text)', fontSize: '0.9rem', width: '100%' }} placeholder="ค้นหาชื่อ ห้อง เลข..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
                  {studentSearch && <button onClick={() => setStudentSearch('')} style={{ color: 'var(--text-3)' }}><X style={{ width: 13, height: 13 }} /></button>}
                </div>
                {selectedStudent && (
                  <button className="btn btn-sm btn-secondary" onClick={() => setSelectedStudent(null)}><X style={{ width: 13, height: 13 }} /> ปิดพาเนล</button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: selectedStudent ? '1fr 320px' : '1fr', gap: 14 }}>
                <div className="d-card" style={{ overflowX: 'auto', padding: 0 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-3)' }}>
                        {['ชื่อ-นามสกุล', 'ห้อง', 'เลขประจำตัว', 'ลงทะเบียน', 'เช็คอิน'].map((h) => (
                          <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s) => (
                        <tr
                          key={s.id}
                          style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem', cursor: 'pointer', background: selectedStudent?.id === s.id ? 'var(--accent-dim)' : undefined }}
                          onClick={() => { setSelectedStudent(s); setEditStudentForm({ nickname: s.nickname, phone: s.phone, lineId: s.lineId, instagram: s.instagram, allergies: s.allergies, healthNote: s.healthNote, emergencyName: s.emergencyName, emergencyPhone: s.emergencyPhone }); setEditingStudent(false); }}
                        >
                          <td style={{ padding: '8px 12px' }}>{s.firstname} {s.lastname} {s.nickname ? `(${s.nickname})` : ''}</td>
                          <td style={{ padding: '8px 12px' }}>{s.room}</td>
                          <td style={{ padding: '8px 12px' }}>{s.studentId}</td>
                          <td style={{ padding: '8px 12px' }}>{s.registered ? <span className="badge badge-green">✓</span> : <span className="badge badge-muted">-</span>}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <button className={`badge ${s.checkedIn ? 'badge-green' : 'badge-muted'}`} style={{ cursor: 'pointer', border: 'none' }} onClick={(e) => { e.stopPropagation(); toggleCheckin(s.id, !!s.checkedIn); }}>
                              {s.checkedIn ? '✓ เช็คอิน' : 'เช็คอิน'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedStudent && (
                  <div className="d-card" style={{ alignSelf: 'start' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedStudent.firstname} {selectedStudent.lastname}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{selectedStudent.email}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => setEditingStudent((e) => !e)}>
                          <Edit3 style={{ width: 12, height: 12 }} />
                        </button>
                        <button className="btn btn-sm" style={{ background: 'var(--red-dim)', color: 'var(--red)' }} onClick={() => deleteStudent(selectedStudent.id)}>
                          <Trash2 style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    </div>

                    {!editingStudent ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.83rem' }}>
                        {([['ห้อง', selectedStudent.room], ['เลขประจำตัว', selectedStudent.studentId], ['ชื่อเล่น', selectedStudent.nickname], ['เบอร์โทร', selectedStudent.phone], ['Line ID', selectedStudent.lineId], ['Instagram', selectedStudent.instagram], ['อาการแพ้', selectedStudent.allergies], ['หมายเหตุสุขภาพ', selectedStudent.healthNote], ['ผู้ติดต่อฉุกเฉิน', selectedStudent.emergencyName], ['เบอร์ฉุกเฉิน', selectedStudent.emergencyPhone]] as [string, string | undefined][]).filter(([,v]) => v).map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', gap: 8 }}>
                            <span style={{ color: 'var(--text-3)', minWidth: 110 }}>{k}</span>
                            <span>{v}</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                          <span className={`badge ${selectedStudent.registered ? 'badge-green' : 'badge-muted'}`}>{selectedStudent.registered ? 'ลงทะเบียนแล้ว' : 'ยังไม่ลงทะเบียน'}</span>
                          <span className={`badge ${selectedStudent.checkedIn ? 'badge-green' : 'badge-muted'}`}>{selectedStudent.checkedIn ? 'เช็คอินแล้ว' : 'ยังไม่เช็คอิน'}</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {([['nickname', 'ชื่อเล่น'], ['phone', 'เบอร์โทร'], ['lineId', 'Line ID'], ['instagram', 'Instagram'], ['allergies', 'อาการแพ้'], ['emergencyName', 'ผู้ติดต่อฉุกเฉิน'], ['emergencyPhone', 'เบอร์ฉุกเฉิน']] as [keyof Student, string][]).map(([key, label]) => (
                          <div key={key} className="form-group">
                            <label className="form-label">{label}</label>
                            <input className="form-input" style={{ fontSize: '0.85rem', padding: '7px 10px' }} value={(editStudentForm[key] as string) ?? ''} onChange={(e) => setEditStudentForm((p) => ({ ...p, [key]: e.target.value }))} />
                          </div>
                        ))}
                        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                          <button className="btn btn-sm btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditingStudent(false)}>ยกเลิก</button>
                          <button className="btn btn-sm btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={saveStudentEdit}>บันทึก</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ══ GROUPS ══ */}
          {section === 'groups' && (
            <>
              <div className="page-title"><h2>กลุ่ม/ทีม</h2><p>{groups.length} กลุ่ม</p></div>

              <div className="d-card" style={{ marginBottom: 14 }}>
                <div className="d-card-label">การแสดงกลุ่ม</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button className={`toggle ${groupsRevealed ? 'on' : ''}`} onClick={toggleGroupReveal} />
                  <span style={{ fontSize: '0.9rem' }}>
                    {groupsRevealed ? <><Eye style={{ width: 13, height: 13, display: 'inline', marginRight: 4 }} />เปิดเผยกลุ่มให้นักเรียนเห็นแล้ว</> : <><EyeOff style={{ width: 13, height: 13, display: 'inline', marginRight: 4 }} />ยังไม่เปิดเผยกลุ่ม</>}
                  </span>
                </div>
              </div>

              <div className="d-card" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" style={{ flex: 1 }} placeholder="ชื่อกลุ่มใหม่..." value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addGroup(); }} />
                  <button className="btn btn-primary" onClick={addGroup}><Plus style={{ width: 14, height: 14 }} /> เพิ่มกลุ่ม</button>
                </div>
              </div>

              <div className="d-card" style={{ marginBottom: 14 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-3)' }}>
                      <th style={{ textAlign: 'left', padding: '8px 6px' }}>ชื่อกลุ่ม</th>
                      <th style={{ textAlign: 'left', padding: '8px 6px' }}>สมาชิก</th>
                      <th style={{ padding: '8px 6px' }} />
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((g) => (
                      <tr key={g.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                        <td style={{ padding: '8px 6px', fontWeight: 600 }}>{g.name}</td>
                        <td style={{ padding: '8px 6px', color: 'var(--text-3)' }}>{g.members?.length ?? 0} คน</td>
                        <td style={{ padding: '8px 6px', textAlign: 'right' }}>
                          <button className="btn btn-sm btn-ghost" style={{ color: 'var(--red)' }} onClick={() => deleteGroup(g.id)}><Trash2 style={{ width: 13, height: 13 }} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button className="btn btn-sm" style={{ background: 'var(--red-dim)', color: 'var(--red)' }} onClick={resetGroups}>
                รีเซ็ตกลุ่มทั้งหมด
              </button>
            </>
          )}

          {/* ══ CHECK-IN ══ */}
          {section === 'checkin' && (
            <>
              <div className="page-title"><h2>Check-in</h2><p>เช็คอิน {counts.checkedIn}/{counts.students} คน</p></div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
                  <Search style={{ width: 14, height: 14, color: 'var(--text-3)', flexShrink: 0 }} />
                  <input style={{ border: 'none', background: 'none', outline: 'none', color: 'var(--text)', fontSize: '0.9rem', width: '100%' }} placeholder="ค้นหาชื่อ ห้อง เลขประจำตัว..." value={ciSearch} onChange={(e) => setCiSearch(e.target.value)} autoFocus />
                  {ciSearch && <button onClick={() => setCiSearch('')} style={{ color: 'var(--text-3)' }}><X style={{ width: 13, height: 13 }} /></button>}
                </div>
              </div>

              <div className="d-card" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-3)' }}>
                      {['ชื่อ-นามสกุล', 'ห้อง', 'เลขประจำตัว', 'สถานะ'].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 8px', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ciStudents.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                        <td style={{ padding: '8px 8px' }}>{s.firstname} {s.lastname} {s.nickname ? `(${s.nickname})` : ''}</td>
                        <td style={{ padding: '8px 8px' }}>{s.room}</td>
                        <td style={{ padding: '8px 8px' }}>{s.studentId}</td>
                        <td style={{ padding: '8px 8px' }}>
                          <button
                            className={`badge ${s.checkedIn ? 'badge-green' : 'badge-muted'}`}
                            style={{ cursor: 'pointer', border: 'none', minWidth: 80 }}
                            onClick={() => toggleCheckin(s.id, !!s.checkedIn)}
                          >
                            {s.checkedIn ? '✓ เช็คอินแล้ว' : '+ เช็คอิน'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {ciStudents.length === 0 && (
                      <tr><td colSpan={4} style={{ padding: '20px 8px', textAlign: 'center', color: 'var(--text-3)' }}>ไม่พบนักเรียน</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ══ REGISTRATION SETTINGS ══ */}
          {section === 'registration' && (
            <>
              <div className="page-title"><h2>ตั้งค่าการลงทะเบียน</h2></div>
              <div className="d-card">
                <div className="d-card-label">สถานะการรับสมัคร</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <button className={`toggle ${regSettings.isOpen ? 'on' : ''}`} onClick={() => setRegSettings((p) => ({ ...p, isOpen: !p.isOpen }))} />
                  <span style={{ fontSize: '0.9rem' }}>{regSettings.isOpen ? 'เปิดรับสมัครอยู่' : 'ปิดรับสมัครแล้ว'}</span>
                </div>

                <div className="form-grid" style={{ marginBottom: 14 }}>
                  <div className="form-group">
                    <label className="form-label">วันเริ่มรับสมัคร</label>
                    <input className="form-input" type="datetime-local" value={regSettings.startDate} onChange={(e) => setRegSettings((p) => ({ ...p, startDate: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">วันสิ้นสุด</label>
                    <input className="form-input" type="datetime-local" value={regSettings.endDate} onChange={(e) => setRegSettings((p) => ({ ...p, endDate: e.target.value }))} />
                  </div>
                  <div className="form-group full">
                    <label className="form-label">ห้องที่ลงทะเบียนได้ (คั่นด้วยจุลภาค)</label>
                    <input className="form-input" placeholder="6/1, 6/2, 6/3, ..." value={regSettings.eligibleRooms} onChange={(e) => setRegSettings((p) => ({ ...p, eligibleRooms: e.target.value }))} />
                    <span className="form-hint">ปล่อยว่างหากอนุญาตทุกห้อง</span>
                  </div>
                </div>

                <button className="btn btn-primary" onClick={saveRegSettings} disabled={savingReg}>
                  <Check style={{ width: 14, height: 14 }} /> {savingReg ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </>
          )}

          {/* ══ COMMITTEE ══ */}
          {section === 'committee' && (
            <>
              <div className="page-title" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div><h2>บุคลากร</h2><p>{committeeList.length} คน</p></div>
                <button className="btn btn-primary btn-sm" onClick={openNewMember}><Plus style={{ width: 14, height: 14 }} /> เพิ่ม</button>
              </div>

              {/* Member form */}
              {showMemberForm && (
                <div className="d-card" style={{ marginBottom: 16, borderColor: 'var(--accent)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontWeight: 600 }}>{editingMember ? 'แก้ไขบุคลากร' : 'เพิ่มบุคลากรใหม่'}</div>
                    <button onClick={closeMemberForm}><X style={{ width: 15, height: 15, color: 'var(--text-3)' }} /></button>
                  </div>
                  <div className="form-grid">
                    {([['firstName','ชื่อ'],['lastName','นามสกุล'],['nickname','ชื่อเล่น'],['department','ฝ่าย/กลุ่ม'],['position','ตำแหน่ง'],['room','ห้อง'],['email','อีเมล'],['instagram','Instagram']] as [keyof CommitteeMember, string][]).map(([k, l]) => (
                      <div key={k} className="form-group">
                        <label className="form-label">{l}</label>
                        <input className="form-input" value={(memberForm[k] as string) ?? ''} onChange={(e) => setMemberForm((p) => ({ ...p, [k]: e.target.value }))} />
                      </div>
                    ))}
                    <div className="form-group">
                      <label className="form-label">ลำดับ</label>
                      <input className="form-input" type="number" value={memberForm.order ?? 0} onChange={(e) => setMemberForm((p) => ({ ...p, order: Number(e.target.value) }))} />
                    </div>
                    <div className="form-group full">
                      <label className="form-label">Bio</label>
                      <textarea className="form-input" rows={3} value={memberForm.bio ?? ''} onChange={(e) => setMemberForm((p) => ({ ...p, bio: e.target.value }))} />
                    </div>
                    <div className="form-group full">
                      <label className="form-label">รูปภาพ</label>
                      <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => photoInputRef.current?.click()}>เลือกรูป</button>
                        {photoFile && <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>{photoFile.name}</span>}
                        {!photoFile && memberForm.photoURL && <img src={memberForm.photoURL} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} alt="" />}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={closeMemberForm}>ยกเลิก</button>
                    <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={saveMember} disabled={photoUploading}>
                      {photoUploading ? 'กำลังอัปโหลด...' : 'บันทึก'}
                    </button>
                  </div>
                </div>
              )}

              <div className="d-card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-3)' }}>
                      {['#', 'ชื่อ-นามสกุล', 'ฝ่าย', 'ตำแหน่ง', 'ห้อง', ''].map((h, i) => (
                        <th key={i} style={{ textAlign: 'left', padding: '8px 6px', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {committeeList.map((m) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                        <td style={{ padding: '8px 6px', color: 'var(--text-3)' }}>{m.order ?? '-'}</td>
                        <td style={{ padding: '8px 6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {m.photoURL && <img src={m.photoURL} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} alt="" />}
                            <span>{m.firstName} {m.lastName} {m.nickname ? `(${m.nickname})` : ''}</span>
                          </div>
                        </td>
                        <td style={{ padding: '8px 6px' }}>{m.department}</td>
                        <td style={{ padding: '8px 6px' }}>{m.position}</td>
                        <td style={{ padding: '8px 6px' }}>{m.room}</td>
                        <td style={{ padding: '8px 6px', textAlign: 'right', display: 'flex', gap: 4 }}>
                          <button className="btn btn-sm btn-ghost" onClick={() => openEditMember(m)}><Edit3 style={{ width: 13, height: 13 }} /></button>
                          <button className="btn btn-sm btn-ghost" style={{ color: 'var(--red)' }} onClick={() => deleteMember(m.id)}><Trash2 style={{ width: 13, height: 13 }} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ══ ANNOUNCEMENTS ══ */}
          {section === 'announcements' && (
            <>
              <div className="page-title"><h2>ประกาศ</h2></div>
              <div className="d-card" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input className="form-input" placeholder="หัวข้อประกาศ *" value={newAnnTitle} onChange={(e) => setNewAnnTitle(e.target.value)} />
                  <textarea className="form-input" rows={3} placeholder="เนื้อหาประกาศ (ไม่บังคับ)" value={newAnnBody} onChange={(e) => setNewAnnBody(e.target.value)} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
                      <button className={`toggle${newAnnPinned ? ' on' : ''}`} style={{ transform: 'scale(0.85)' }} onClick={() => setNewAnnPinned((p) => !p)} />
                      ปักหมุด
                    </label>
                    <button className="btn btn-primary" onClick={addAnnouncement}><Plus style={{ width: 14, height: 14 }} /> เพิ่มประกาศ</button>
                  </div>
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
                        <td style={{ padding: '8px 4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {a.pinned && <span className="badge badge-gold" style={{ fontSize: '0.68rem' }}>📌 ปักหมุด</span>}
                            <span>{a.title}</span>
                          </div>
                          {a.body && <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 2 }}>{a.body.slice(0, 80)}{a.body.length > 80 ? '...' : ''}</div>}
                        </td>
                        <td style={{ padding: '8px 4px', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{a.createdAt?.toLocaleDateString('th-TH') || '-'}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <button className="btn btn-sm btn-ghost" title={a.pinned ? 'ถอดหมุด' : 'ปักหมุด'} onClick={() => togglePin(a.id, !!a.pinned)}>
                              {a.pinned ? <ChevronDown style={{ width: 13, height: 13 }} /> : <ChevronUp style={{ width: 13, height: 13 }} />}
                            </button>
                            <button className="btn btn-sm btn-ghost" style={{ color: 'var(--red)' }} onClick={() => deleteAnnouncement(a.id)}>
                              <Trash2 style={{ width: 13, height: 13 }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ══ EVENT SETTINGS ══ */}
          {section === 'event-settings' && (
            <>
              <div className="page-title"><h2>ตั้งค่างาน</h2></div>
              <div className="d-card">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">ชื่องาน</label>
                    <input className="form-input" value={eventSettings.name} onChange={(e) => setEventSettings((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">วันที่จัดงาน</label>
                      <input className="form-input" type="date" value={eventSettings.date} onChange={(e) => setEventSettings((p) => ({ ...p, date: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">สถานที่</label>
                      <input className="form-input" value={eventSettings.location} onChange={(e) => setEventSettings((p) => ({ ...p, location: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">รายละเอียด</label>
                    <textarea className="form-input" rows={4} value={eventSettings.description} onChange={(e) => setEventSettings((p) => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">LINE Open Chat URL</label>
                    <input className="form-input" type="url" placeholder="https://line.me/ti/g2/..." value={eventSettings.lineUrl ?? ''} onChange={(e) => setEventSettings((p) => ({ ...p, lineUrl: e.target.value }))} />
                  </div>
                  <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={saveEventSettings} disabled={savingEvent}>
                    <Check style={{ width: 14, height: 14 }} /> {savingEvent ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ══ STAFF ACCOUNTS ══ */}
          {section === 'staff-accounts' && (
            <>
              <div className="page-title"><h2>บัญชีพี่</h2><p>บัญชีสิทธิ์พิเศษ</p></div>
              <div className="d-card" style={{ marginBottom: 14 }}>
                <div className="d-card-label">เพิ่มบัญชีใหม่</div>
                <div className="form-grid" style={{ marginBottom: 10 }}>
                  <div className="form-group">
                    <label className="form-label">อีเมล</label>
                    <input className="form-input" type="email" placeholder="name@example.com" value={newStaff.email} onChange={(e) => setNewStaff((p) => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ชื่อ</label>
                    <input className="form-input" value={newStaff.name} onChange={(e) => setNewStaff((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">สิทธิ์</label>
                    <select className="form-input" value={newStaff.role} onChange={(e) => setNewStaff((p) => ({ ...p, role: e.target.value }))}>
                      <option value="STAFF">STAFF</option>
                      <option value="CHECKIN">CHECKIN</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    </select>
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={addStaff}><Plus style={{ width: 14, height: 14 }} /> เพิ่มบัญชี</button>
              </div>

              <div className="d-card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-3)' }}>
                      {['ชื่อ', 'อีเมล', 'สิทธิ์', 'สถานะ', ''].map((h, i) => (
                        <th key={i} style={{ textAlign: 'left', padding: '8px 6px', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {staffAccounts.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                        <td style={{ padding: '8px 6px' }}>{s.name}</td>
                        <td style={{ padding: '8px 6px', color: 'var(--text-3)' }}>{s.email}</td>
                        <td style={{ padding: '8px 6px' }}><span className="badge badge-accent">{s.role}</span></td>
                        <td style={{ padding: '8px 6px' }}>
                          <button className={`toggle ${s.active ? 'on' : ''}`} style={{ transform: 'scale(0.8)' }} onClick={() => toggleStaffActive(s.id, s.active)} />
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'right' }}>
                          <button className="btn btn-sm btn-ghost" style={{ color: 'var(--red)' }} onClick={() => deleteStaff(s.id)}>
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

          {/* ══ EXPORT ══ */}
          {section === 'export' && (
            <>
              <div className="page-title"><h2>Export</h2><p>ส่งออกข้อมูล</p></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
                <div className="d-card">
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>นักเรียนทั้งหมด (CSV)</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: 14 }}>ชื่อ, ห้อง, เลขประจำตัว, การลงทะเบียน, เช็คอิน</div>
                  <button className="btn btn-primary btn-sm" onClick={exportCSV} disabled={exportLoading}>
                    <FileDown style={{ width: 14, height: 14 }} /> ดาวน์โหลด CSV
                  </button>
                </div>
                <div className="d-card">
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>รายชื่อลงทะเบียน (CSV)</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: 14 }}>เฉพาะนักเรียนที่ลงทะเบียนแล้ว {counts.registered} คน</div>
                  <button className="btn btn-secondary btn-sm" onClick={() => {
                    const registered = students.filter((s) => s.registered);
                    const headers = ['ชื่อ', 'นามสกุล', 'ชื่อเล่น', 'ห้อง', 'เลขประจำตัว', 'เช็คอิน'];
                    const rows = registered.map((s) => [s.firstname ?? '', s.lastname ?? '', s.nickname ?? '', s.room ?? '', s.studentId ?? '', s.checkedIn ? 'ใช่' : 'ไม่']);
                    const bom = '﻿';
                    const csv = bom + [headers, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = 'registered.csv'; a.click();
                    URL.revokeObjectURL(url);
                    showToast('ดาวน์โหลดแล้ว');
                  }}>
                    <FileDown style={{ width: 14, height: 14 }} /> รายชื่อลงทะเบียน
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ══ LOGS ══ */}
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

        </div>
      </div>
    </div>
  );
}
