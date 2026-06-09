'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  doc, getDoc, updateDoc, setDoc, addDoc, deleteDoc,
  collection, query, orderBy, getDocs, limit,
  onSnapshot, where, arrayUnion, arrayRemove,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db, SUPER_ADMIN } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import DashboardSidebar, { DashboardSection } from '@/components/DashboardSidebar';
import AvatarPicker from '@/components/AvatarPicker';
import { getInitials } from '@/lib/utils';
import {
  Home, Layers, Users, Calendar, User, Lock, Bell, QrCode,
  ClipboardCheck, ChevronRight, LayoutDashboard, X,
  RefreshCw, Key, UserPlus, LogOut, Search, Trash2,
  MessageCircle,
} from 'lucide-react';

// ── Interfaces ────────────────────────────────────────────────────────────────
interface StudentData {
  firstname?: string; lastname?: string; nickname?: string;
  room?: string; studentId?: string;
  phone?: string; lineId?: string; instagram?: string;
  allergies?: string; healthNote?: string;
  emergencyName?: string; emergencyPhone?: string; emergencyRelation?: string;
  photoURL?: string;
  registered?: boolean; checkedIn?: boolean;
  groupId?: string; trioGroupId?: string;
}

interface Announcement {
  id: string; title: string; body?: string; createdAt: Date | null; pinned?: boolean;
}

interface MemberInfo {
  uid: string; name: string; nickname?: string; room?: string;
}

interface TrioGroup {
  id: string;
  leaderId: string;
  members: string[];
  memberInfo: MemberInfo[];
  code: string;
  joinRequests: MemberInfo[];
  createdAt: Date | null;
}

interface StudentSearchResult {
  uid: string; firstname?: string; lastname?: string; nickname?: string; room?: string;
}

interface AssignedGroup {
  id: string; name: string; members: string[]; memberInfo?: MemberInfo[];
}

interface EventInfo {
  name?: string; date?: string; location?: string; description?: string; lineUrl?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function useCountdown(target: Date | null) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (!target) return;
    function tick() {
      const diff = target!.getTime() - Date.now();
      if (diff <= 0) { setText(''); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setText(d > 0 ? `${d} วัน ${h} ชม. ${m} นาที` : `${h} ชม. ${m} นาที ${s} วิ`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return text;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [section, setSection]       = useState<DashboardSection>('home');
  const [student, setStudent]       = useState<StudentData | null>(null);
  const [avatarUrl, setAvatarUrl]   = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedAnn, setSelectedAnn]     = useState<Announcement | null>(null);
  const [editMode, setEditMode]     = useState(false);
  const [editForm, setEditForm]     = useState<Partial<StudentData>>({});

  // Group (admin-assigned)
  const [myGroup, setMyGroup]         = useState<AssignedGroup | null>(null);
  const [groupRevealed, setGroupRevealed] = useState(false);
  const [revealTime, setRevealTime]   = useState<Date | null>(null);
  const [groupLoading, setGroupLoading] = useState(true);
  const countdown = useCountdown(revealTime);

  // Trio
  const [trioGroup, setTrioGroup]     = useState<TrioGroup | null>(null);
  const [trioLoading, setTrioLoading] = useState(true);
  const [trioView, setTrioView]       = useState<'main' | 'join' | 'create'>('main');
  const [joinCode, setJoinCode]       = useState('');
  const [trioSearch, setTrioSearch]   = useState('');
  const [trioSearchResults, setTrioSearchResults] = useState<StudentSearchResult[]>([]);
  const [trioSearching, setTrioSearching] = useState(false);
  const trioUnsubRef = useRef<(() => void) | null>(null);

  // Event info
  const [eventInfo, setEventInfo]     = useState<EventInfo | null>(null);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  // ── Real-time student listener ──────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'students', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as StudentData;
        setStudent(data);
        setAvatarUrl(data.photoURL || user.photoURL || null);
        setEditForm({
          nickname: data.nickname, phone: data.phone, lineId: data.lineId,
          instagram: data.instagram, allergies: data.allergies, healthNote: data.healthNote,
          emergencyName: data.emergencyName, emergencyPhone: data.emergencyPhone,
        });
        // Load Trio group if id changed
        if (data.trioGroupId) {
          loadTrioGroup(data.trioGroupId);
        } else {
          setTrioGroup(null);
          setTrioLoading(false);
        }
      } else {
        setAvatarUrl(user.photoURL || null);
        setTrioLoading(false);
      }
    });
    return () => unsub();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Announcements ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(10));
    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map((d) => {
        const data = d.data();
        const ts = data.createdAt as Timestamp | null;
        return { id: d.id, title: data.title || '-', body: data.body, createdAt: ts?.toDate() ?? null, pinned: data.pinned };
      }));
    });
    return () => unsub();
  }, [user]);

  // ── Group (admin-assigned) ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !student) return;
    async function loadGroup() {
      setGroupLoading(true);
      try {
        const settSnap = await getDoc(doc(db, 'settings', 'groups'));
        if (settSnap.exists()) {
          const s = settSnap.data();
          setGroupRevealed(!!s.revealed);
          if (!s.revealed && s.revealTime) setRevealTime((s.revealTime as Timestamp).toDate());
        }
        if (student!.groupId) {
          const gSnap = await getDoc(doc(db, 'groups', student!.groupId));
          if (gSnap.exists()) setMyGroup({ id: gSnap.id, ...gSnap.data() } as AssignedGroup);
        }
      } catch (_) {}
      setGroupLoading(false);
    }
    loadGroup();
  }, [user, student?.groupId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Event info ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'settings', 'event')).then((snap) => {
      if (snap.exists()) setEventInfo(snap.data() as EventInfo);
    });
  }, [user]);

  // ── Trio loader (subscribes to the group doc) ─────────────────────────────────
  function loadTrioGroup(groupId: string) {
    if (trioUnsubRef.current) trioUnsubRef.current();
    const unsub = onSnapshot(doc(db, 'trioGroups', groupId), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        const ts = d.createdAt as Timestamp | null;
        setTrioGroup({ id: snap.id, ...d, createdAt: ts?.toDate() ?? null } as TrioGroup);
      } else {
        // Group was disbanded
        setTrioGroup(null);
        if (user) updateDoc(doc(db, 'students', user.uid), { trioGroupId: null });
      }
      setTrioLoading(false);
    });
    trioUnsubRef.current = unsub;
  }

  useEffect(() => () => { trioUnsubRef.current?.(); }, []);

  // ── Trio actions ──────────────────────────────────────────────────────────────
  async function createTrio() {
    if (!user || !student) return;
    const code = genCode();
    const myInfo: MemberInfo = {
      uid: user.uid,
      name: `${student.firstname ?? ''} ${student.lastname ?? ''}`.trim() || user.displayName || '',
      nickname: student.nickname,
      room: student.room,
    };
    const groupRef = await addDoc(collection(db, 'trioGroups'), {
      leaderId: user.uid,
      members: [user.uid],
      memberInfo: [myInfo],
      code,
      joinRequests: [],
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'students', user.uid), { trioGroupId: groupRef.id });
    setTrioView('main');
    showToast('สร้างกลุ่ม Trio แล้ว');
  }

  async function sendJoinRequest() {
    if (!user || !student || !joinCode.trim()) return;
    const q = query(collection(db, 'trioGroups'), where('code', '==', joinCode.trim().toUpperCase()), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) { showToast('ไม่พบรหัสนี้', 'error'); return; }
    const groupDoc = snap.docs[0];
    const group = groupDoc.data() as TrioGroup;
    if (group.members?.length >= 3)    { showToast('กลุ่มเต็มแล้ว (3/3)', 'error'); return; }
    if (group.members?.includes(user.uid)) { showToast('คุณอยู่ในกลุ่มนี้แล้ว', 'error'); return; }
    const myInfo: MemberInfo = {
      uid: user.uid,
      name: `${student.firstname ?? ''} ${student.lastname ?? ''}`.trim() || user.displayName || '',
      nickname: student.nickname, room: student.room,
    };
    await updateDoc(groupDoc.ref, { joinRequests: arrayUnion(myInfo) });
    setJoinCode(''); setTrioView('main');
    showToast('ส่งคำขอแล้ว รอการยืนยันจากหัวหน้ากลุ่ม');
  }

  async function acceptRequest(info: MemberInfo) {
    if (!trioGroup || !user) return;
    if (trioGroup.members.length >= 3) { showToast('กลุ่มเต็มแล้ว', 'error'); return; }
    await updateDoc(doc(db, 'trioGroups', trioGroup.id), {
      members: arrayUnion(info.uid),
      memberInfo: arrayUnion(info),
      joinRequests: arrayRemove(info),
    });
    await updateDoc(doc(db, 'students', info.uid), { trioGroupId: trioGroup.id });
    showToast(`รับ ${info.nickname || info.name} เข้ากลุ่มแล้ว`);
  }

  async function rejectRequest(info: MemberInfo) {
    if (!trioGroup) return;
    await updateDoc(doc(db, 'trioGroups', trioGroup.id), { joinRequests: arrayRemove(info) });
    showToast('ปฏิเสธแล้ว');
  }

  async function kickMember(info: MemberInfo) {
    if (!trioGroup || !confirm(`เตะ ${info.nickname || info.name} ออกจากกลุ่ม?`)) return;
    await updateDoc(doc(db, 'trioGroups', trioGroup.id), {
      members: arrayRemove(info.uid),
      memberInfo: arrayRemove(info),
    });
    await updateDoc(doc(db, 'students', info.uid), { trioGroupId: null });
    showToast('เตะออกแล้ว');
  }

  async function leaveGroup() {
    if (!trioGroup || !user || !student || !confirm('ออกจากกลุ่ม Trio?')) return;
    const myInfo = trioGroup.memberInfo?.find((m) => m.uid === user.uid);
    if (myInfo) {
      await updateDoc(doc(db, 'trioGroups', trioGroup.id), {
        members: arrayRemove(user.uid),
        memberInfo: arrayRemove(myInfo),
      });
    }
    await updateDoc(doc(db, 'students', user.uid), { trioGroupId: null });
    showToast('ออกจากกลุ่มแล้ว');
  }

  async function disbandGroup() {
    if (!trioGroup || !confirm('ยุบกลุ่ม Trio? สมาชิกทั้งหมดจะถูกถอดออก')) return;
    for (const uid of trioGroup.members) {
      await updateDoc(doc(db, 'students', uid), { trioGroupId: null });
    }
    await deleteDoc(doc(db, 'trioGroups', trioGroup.id));
    showToast('ยุบกลุ่มแล้ว');
  }

  async function regenCode() {
    if (!trioGroup) return;
    const code = genCode();
    await updateDoc(doc(db, 'trioGroups', trioGroup.id), { code });
    showToast('สร้างรหัสใหม่แล้ว');
  }

  async function searchStudents(q: string) {
    if (!q.trim() || q.length < 2) { setTrioSearchResults([]); return; }
    setTrioSearching(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'students'),
          where('nickname', '>=', q), where('nickname', '<=', q + ''), limit(5))
      );
      setTrioSearchResults(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as StudentSearchResult)));
    } catch (_) {}
    setTrioSearching(false);
  }

  async function inviteMember(targetUid: string) {
    if (!trioGroup) return;
    await updateDoc(doc(db, 'trioGroups', trioGroup.id), {
      joinRequests: arrayUnion({ uid: targetUid, name: '', nickname: '', room: '' }),
    });
    showToast('ส่งคำเชิญแล้ว');
  }

  // ── Profile save ──────────────────────────────────────────────────────────────
  async function saveProfile() {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'students', user.uid), { ...editForm });
      setEditMode(false);
      showToast('บันทึกข้อมูลเรียบร้อย');
    } catch { showToast('เกิดข้อผิดพลาด', 'error'); }
  }

  // ── Render guards ─────────────────────────────────────────────────────────────
  if (loading || !user) return null;

  const isAdmin    = user.email === SUPER_ADMIN;
  const displayName = student?.firstname ? `${student.firstname} ${student.lastname}` : user.displayName || '';
  const initials   = getInitials(displayName || user.email || '');
  const isLeader   = trioGroup?.leaderId === user.uid;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      <DashboardSidebar
        activeSection={section}
        onSectionChange={setSection}
        isAdmin={isAdmin}
        showPassEntry={true}
      />

      <div className="main-content">
        {/* Top bar */}
        <div className="topbar">
          <div className="topbar-title">
            {section === 'home' ? 'หน้าหลัก' :
             section === 'group' ? 'กลุ่มของฉัน' :
             section === 'duo' ? 'กลุ่ม Trio' :
             section === 'activity' ? 'กิจกรรม' :
             section === 'profile' ? 'โปรไฟล์' : 'บัตรเข้างาน'}
          </div>
          <div className="topbar-right">
            {isAdmin && (
              <button className="btn btn-sm" onClick={() => router.push('/admin')} style={{ background: 'var(--amber-dim)', color: 'var(--amber)', border: '1px solid var(--amber-dim)' }}>
                <LayoutDashboard style={{ width: 12, height: 12 }} /> Admin
              </button>
            )}
            <div className="top-av-wrap" onClick={() => setSection('profile')}>
              <div id="top-avatar">
                {avatarUrl ? <img src={avatarUrl} alt="avatar" /> : initials}
              </div>
            </div>
          </div>
        </div>

        {/* ══ HOME ══ */}
        {section === 'home' && (
          <div className="page-section active">
            <div className="greeting">
              <div className="greeting-name">สวัสดี, {student?.nickname || displayName || 'น้องใหม่'}!</div>
              <div className="greeting-sub">ยินดีต้อนรับสู่ระบบกิจกรรมรับน้อง CARNIVAL 89</div>
            </div>

            <div className="status-row">
              <div className="status-mini">
                <div className="status-mini-label"><ClipboardCheck style={{ width: 11, height: 11 }} /> ลงทะเบียน</div>
                {student?.registered
                  ? <span className="badge badge-green">เรียบร้อย</span>
                  : <span className="badge badge-muted">ยังไม่ได้</span>}
              </div>
              <div className="status-mini">
                <div className="status-mini-label"><Users style={{ width: 11, height: 11 }} /> เช็คอิน</div>
                {student?.checkedIn
                  ? <span className="badge badge-green">เช็คอินแล้ว</span>
                  : <span className="badge badge-muted">ยังไม่ได้</span>}
              </div>
            </div>

            {!student?.registered && (
              <a className="btn btn-primary" href="/register" style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}>
                ลงทะเบียนเข้าร่วมกิจกรรม
              </a>
            )}

            {/* LINE card */}
            {eventInfo?.lineUrl && (
              <a href={eventInfo.lineUrl} target="_blank" rel="noreferrer" className="d-card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, textDecoration: 'none', background: 'var(--green-dim)', borderColor: 'var(--green)' }}>
                <MessageCircle style={{ width: 20, height: 20, color: 'var(--green)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--green)' }}>LINE Open Chat</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>เข้าร่วมกลุ่ม LINE ของงาน</div>
                </div>
                <ChevronRight style={{ width: 14, height: 14, color: 'var(--green)', marginLeft: 'auto' }} />
              </a>
            )}

            {/* Announcements */}
            <div className="d-card">
              <div className="d-card-label"><Bell style={{ width: 12, height: 12 }} /> ประกาศล่าสุด</div>
              {announcements.length === 0
                ? <div className="text-sm text-muted">ยังไม่มีประกาศ</div>
                : announcements.map((a) => (
                  <div
                    key={a.id}
                    className="ann-item"
                    style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: a.body ? 'pointer' : 'default' }}
                    onClick={() => a.body && setSelectedAnn(a)}
                  >
                    <div className="ann-dot" />
                    <div style={{ flex: 1 }}>
                      <div className="ann-text" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {a.pinned && <span style={{ fontSize: '0.72rem' }}>📌</span>}
                        {a.title}
                      </div>
                      {a.body && <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>{a.body.slice(0, 60)}{a.body.length > 60 ? '...' : ''}</div>}
                    </div>
                    <div className="ann-date">{a.createdAt?.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) || ''}</div>
                    {a.body && <ChevronRight style={{ width: 12, height: 12, color: 'var(--text-3)' }} />}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ══ GROUP ══ */}
        {section === 'group' && (
          <div className="page-section active">
            <div className="section-header"><h2>กลุ่มของฉัน</h2></div>
            {groupLoading ? (
              <div className="d-card" style={{ textAlign: 'center', padding: 32 }}>
                <RefreshCw style={{ width: 20, height: 20, color: 'var(--text-3)', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : !groupRevealed ? (
              <div className="d-card" style={{ textAlign: 'center', padding: '36px 20px' }}>
                <Lock style={{ width: 28, height: 28, color: 'var(--text-3)', marginBottom: 12 }} />
                <div style={{ fontWeight: 700, marginBottom: 6 }}>รอประกาศกลุ่ม</div>
                {countdown ? (
                  <div className="text-sm text-muted">จะเปิดเผยใน <strong style={{ color: 'var(--accent)' }}>{countdown}</strong></div>
                ) : (
                  <div className="text-sm text-muted">พี่ๆ จะประกาศกลุ่มเร็วๆ นี้</div>
                )}
              </div>
            ) : myGroup ? (
              <div className="d-card">
                <div style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: 4, color: 'var(--accent)' }}>{myGroup.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: 14 }}>กลุ่มที่คุณได้รับมอบหมาย</div>
                <div className="d-card-label">สมาชิกในกลุ่ม</div>
                {myGroup.memberInfo?.map((m) => (
                  <div key={m.uid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div className="avatar avatar-sm">{getInitials(m.name)}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.name}</div>
                      {m.nickname && <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>({m.nickname}) ห้อง {m.room}</div>}
                    </div>
                    {m.uid === user.uid && <span className="badge badge-accent" style={{ marginLeft: 'auto', fontSize: '0.68rem' }}>ฉัน</span>}
                  </div>
                )) ?? (
                  <div className="text-sm text-muted">ยังไม่มีข้อมูลสมาชิก</div>
                )}
              </div>
            ) : (
              <div className="d-card" style={{ textAlign: 'center', padding: '36px 20px' }}>
                <Layers style={{ width: 28, height: 28, color: 'var(--text-3)', marginBottom: 12 }} />
                <div style={{ fontWeight: 700, marginBottom: 6 }}>ยังไม่มีกลุ่ม</div>
                <div className="text-sm text-muted">คุณยังไม่ได้รับการมอบหมายกลุ่ม</div>
              </div>
            )}
          </div>
        )}

        {/* ══ TRIO ══ */}
        {section === 'duo' && (
          <div className="page-section active">
            <div className="section-header"><h2>กลุ่ม Trio</h2><p>จับกลุ่ม 3 คน</p></div>

            {trioLoading ? (
              <div className="d-card" style={{ textAlign: 'center', padding: 32 }}>
                <RefreshCw style={{ width: 20, height: 20, color: 'var(--text-3)', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : !trioGroup ? (
              <>
                {trioView === 'main' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="d-card" style={{ textAlign: 'center', padding: '28px 20px' }}>
                      <Users style={{ width: 32, height: 32, color: 'var(--accent)', margin: '0 auto 12px' }} />
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>คุณยังไม่มีกลุ่ม Trio</div>
                      <div className="text-sm text-muted" style={{ marginBottom: 20 }}>สร้างกลุ่มหรือเข้าร่วมด้วยรหัส</div>
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => setTrioView('create')}>
                          <UserPlus style={{ width: 13, height: 13 }} /> สร้างกลุ่ม
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setTrioView('join')}>
                          <Key style={{ width: 13, height: 13 }} /> ใช้รหัสเข้าร่วม
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {trioView === 'create' && (
                  <div className="d-card">
                    <div className="d-card-label">สร้างกลุ่ม Trio ใหม่</div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.7 }}>
                      คุณจะเป็นหัวหน้ากลุ่ม และได้รับรหัสเชิญเพื่อนเข้าร่วม (รับสมาชิกได้สูงสุด 3 คน รวมคุณ)
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setTrioView('main')}>ยกเลิก</button>
                      <button className="btn btn-primary"   style={{ flex: 1, justifyContent: 'center' }} onClick={createTrio}>
                        <UserPlus style={{ width: 13, height: 13 }} /> สร้างกลุ่ม
                      </button>
                    </div>
                  </div>
                )}

                {trioView === 'join' && (
                  <div className="d-card">
                    <div className="d-card-label">เข้าร่วมด้วยรหัส</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <input
                        className="form-input"
                        style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}
                        placeholder="รหัส 6 ตัว"
                        maxLength={6}
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => { if (e.key === 'Enter') sendJoinRequest(); }}
                      />
                      <button className="btn btn-primary" onClick={sendJoinRequest} disabled={joinCode.length !== 6}>ส่งคำขอ</button>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setTrioView('main')}>← กลับ</button>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Group card */}
                <div className="d-card" style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>กลุ่ม Trio</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{trioGroup.members.length}/3 สมาชิก</div>
                    </div>
                    <span className={`badge ${trioGroup.members.length >= 3 ? 'badge-green' : 'badge-amber'}`}>
                      {trioGroup.members.length >= 3 ? 'กลุ่มเต็ม' : 'รับสมาชิก'}
                    </span>
                  </div>

                  {/* Members */}
                  <div className="d-card-label">สมาชิก</div>
                  {trioGroup.memberInfo?.map((m) => (
                    <div key={m.uid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <div className="avatar avatar-sm">{getInitials(m.name)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.name}</div>
                        {m.nickname && <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>({m.nickname}) • ห้อง {m.room}</div>}
                      </div>
                      {m.uid === trioGroup.leaderId && <span className="badge badge-gold" style={{ fontSize: '0.68rem' }}>หัวหน้า</span>}
                      {m.uid === user.uid && <span className="badge badge-accent" style={{ fontSize: '0.68rem' }}>ฉัน</span>}
                      {isLeader && m.uid !== user.uid && (
                        <button className="btn btn-sm btn-ghost" style={{ color: 'var(--red)' }} onClick={() => kickMember(m)}>
                          <Trash2 style={{ width: 12, height: 12 }} />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Join code (leader only) */}
                  {isLeader && (
                    <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 4 }}>รหัสเชิญ</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.14em', color: 'var(--accent)' }}>{trioGroup.code}</span>
                        <button className="btn btn-sm btn-secondary" onClick={regenCode} title="สร้างรหัสใหม่">
                          <RefreshCw style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    {!isLeader && (
                      <button className="btn btn-secondary btn-sm" style={{ color: 'var(--red)' }} onClick={leaveGroup}>
                        <LogOut style={{ width: 12, height: 12 }} /> ออกจากกลุ่ม
                      </button>
                    )}
                    {isLeader && (
                      <button className="btn btn-sm" style={{ background: 'var(--red-dim)', color: 'var(--red)' }} onClick={disbandGroup}>
                        ยุบกลุ่ม
                      </button>
                    )}
                  </div>
                </div>

                {/* Join requests (leader) */}
                {isLeader && trioGroup.joinRequests?.length > 0 && (
                  <div className="d-card">
                    <div className="d-card-label">คำขอเข้าร่วม ({trioGroup.joinRequests.length})</div>
                    {trioGroup.joinRequests.map((req) => (
                      <div key={req.uid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                        <div className="avatar avatar-sm">{getInitials(req.name)}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{req.name}</div>
                          {req.nickname && <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>({req.nickname}) • ห้อง {req.room}</div>}
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-sm btn-primary" onClick={() => acceptRequest(req)}>รับ</button>
                          <button className="btn btn-sm btn-secondary" style={{ color: 'var(--red)' }} onClick={() => rejectRequest(req)}>
                            <X style={{ width: 12, height: 12 }} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Friend search (leader, group not full) */}
                {isLeader && trioGroup.members.length < 3 && (
                  <div className="d-card">
                    <div className="d-card-label"><Search style={{ width: 11, height: 11 }} /> ค้นหาเพื่อนเชิญ</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input
                        className="form-input"
                        placeholder="พิมพ์ชื่อเล่น..."
                        value={trioSearch}
                        onChange={(e) => { setTrioSearch(e.target.value); searchStudents(e.target.value); }}
                        style={{ flex: 1 }}
                      />
                    </div>
                    {trioSearching && <div className="text-sm text-muted">กำลังค้นหา...</div>}
                    {trioSearchResults.map((s) => (
                      <div key={s.uid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                        <div className="avatar avatar-sm">{getInitials(`${s.firstname} ${s.lastname}`)}</div>
                        <div style={{ flex: 1, fontSize: '0.85rem' }}>
                          {s.firstname} {s.lastname} {s.nickname ? `(${s.nickname})` : ''} • ห้อง {s.room}
                        </div>
                        {!trioGroup.members.includes(s.uid) && (
                          <button className="btn btn-sm btn-secondary" onClick={() => inviteMember(s.uid)}>เชิญ</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══ ACTIVITY ══ */}
        {section === 'activity' && (
          <div className="page-section active">
            <div className="section-header"><h2>รายละเอียดกิจกรรม</h2></div>
            {eventInfo?.name ? (
              <div className="d-card">
                <div style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: 8, color: 'var(--accent)' }}>{eventInfo.name}</div>
                {eventInfo.date && <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: 4 }}>📅 {new Date(eventInfo.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>}
                {eventInfo.location && <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: 12 }}>📍 {eventInfo.location}</div>}
                {eventInfo.description && <div style={{ fontSize: '0.875rem', color: 'var(--text-2)', lineHeight: 1.75, borderTop: '1px solid var(--border)', paddingTop: 12 }}>{eventInfo.description}</div>}
                {eventInfo.lineUrl && (
                  <a href={eventInfo.lineUrl} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ marginTop: 14, background: 'var(--green-dim)', color: 'var(--green)', display: 'inline-flex' }}>
                    <MessageCircle style={{ width: 13, height: 13 }} /> เข้าร่วม LINE Open Chat
                  </a>
                )}
              </div>
            ) : (
              <div className="d-card" style={{ textAlign: 'center', padding: '36px 20px' }}>
                <Lock style={{ width: 28, height: 28, color: 'var(--accent)', marginBottom: 12 }} />
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 6 }}>Coming Soon</div>
                <div className="text-sm text-muted" style={{ marginBottom: 20 }}>รายละเอียดกิจกรรมจะเปิดเผยก่อนวันงาน</div>
                <a className="btn btn-secondary btn-sm" href="/event" style={{ justifyContent: 'center' }}>ดูหน้ากิจกรรม</a>
              </div>
            )}
          </div>
        )}

        {/* ══ PASS ══ */}
        {section === 'pass' && (
          <div className="page-section active">
            <div className="section-header"><h2>บัตรเข้างาน</h2><p>แสดง QR Code นี้เพื่อเช็คอินในวันงาน</p></div>
            <div className="qr-wrap">
              <div className="qr-box">
                <QrCode style={{ width: 80, height: 80, color: 'var(--text-3)' }} />
              </div>
              <div className="qr-code-id">{user.uid.slice(0, 12).toUpperCase()}</div>
              <div>{student?.checkedIn ? <span className="badge badge-green">เช็คอินแล้ว</span> : <span className="badge badge-muted">ยังไม่เช็คอิน</span>}</div>
            </div>
          </div>
        )}

        {/* ══ PROFILE ══ */}
        {section === 'profile' && (
          <div className="page-section active">
            <div className="section-header"><h2>โปรไฟล์ของฉัน</h2></div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 20px' }}>
              <AvatarPicker uid={user.uid} onUploaded={(url) => { setAvatarUrl(url); showToast('อัปโหลดรูปสำเร็จ'); }} onError={(msg) => showToast(msg, 'error')}>
                <div className="profile-avatar-wrap">
                  <div className="profile-avatar">
                    {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : initials}
                  </div>
                  <div className="profile-avatar-edit">📷</div>
                </div>
              </AvatarPicker>
              <div style={{ fontWeight: 600, marginTop: 8 }}>{displayName}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{user.email}</div>
            </div>

            {!editMode ? (
              <>
                <div className="d-card" style={{ marginBottom: 10 }}>
                  <div className="d-card-label"><User style={{ width: 12, height: 12 }} /> ข้อมูลส่วนตัว</div>
                  {([
                    ['ชื่อเล่น', student?.nickname],
                    ['ห้องเรียน', student?.room],
                    ['เลขประจำตัว', student?.studentId],
                    ['เบอร์โทร', student?.phone],
                    ['Line ID', student?.lineId],
                    ['Instagram', student?.instagram],
                  ] as [string, string | undefined][]).map(([label, value]) => value ? (
                    <div key={label} className="profile-row">
                      <span className="profile-label">{label}</span>
                      <span className="profile-value">{value}</span>
                    </div>
                  ) : null)}
                </div>
                <div className="d-card" style={{ marginBottom: 10 }}>
                  <div className="d-card-label">สุขภาพ & ฉุกเฉิน</div>
                  {([
                    ['อาการแพ้', student?.allergies],
                    ['หมายเหตุสุขภาพ', student?.healthNote],
                    ['ผู้ติดต่อฉุกเฉิน', student?.emergencyName],
                    ['เบอร์ฉุกเฉิน', student?.emergencyPhone],
                  ] as [string, string | undefined][]).map(([label, value]) => value ? (
                    <div key={label} className="profile-row">
                      <span className="profile-label">{label}</span>
                      <span className="profile-value">{value}</span>
                    </div>
                  ) : null)}
                </div>
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setEditMode(true)}>
                  แก้ไขข้อมูล
                </button>
              </>
            ) : (
              <div className="d-card">
                <div className="d-card-label">แก้ไขข้อมูล</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  {([
                    ['nickname', 'ชื่อเล่น', 'text'],
                    ['phone', 'เบอร์โทร', 'tel'],
                    ['lineId', 'Line ID', 'text'],
                    ['instagram', 'Instagram', 'text'],
                    ['allergies', 'อาการแพ้', 'text'],
                    ['healthNote', 'หมายเหตุสุขภาพ', 'text'],
                    ['emergencyName', 'ชื่อผู้ติดต่อฉุกเฉิน', 'text'],
                    ['emergencyPhone', 'เบอร์ฉุกเฉิน', 'tel'],
                  ] as [keyof StudentData, string, string][]).map(([key, label, type]) => (
                    <div key={key} className="form-group">
                      <label className="form-label">{label}</label>
                      <input className="form-input" type={type} value={(editForm[key] as string) || ''} onChange={(e) => setEditForm((p) => ({ ...p, [key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditMode(false)}>ยกเลิก</button>
                  <button className="btn btn-primary"   style={{ flex: 1, justifyContent: 'center' }} onClick={saveProfile}>บันทึก</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom nav (mobile) */}
      <div className="bottom-nav">
        <div className="bottom-nav-inner">
          {([
            ['home',     'หน้าหลัก', <Home     style={{ width: 20, height: 20 }} />],
            ['group',    'กลุ่ม',    <Layers   style={{ width: 20, height: 20 }} />],
            ['duo',      'Trio',     <Users    style={{ width: 20, height: 20 }} />],
            ['activity', 'กิจกรรม', <Calendar style={{ width: 20, height: 20 }} />],
            ['profile',  'โปรไฟล์', <User     style={{ width: 20, height: 20 }} />],
          ] as [DashboardSection, string, React.ReactNode][]).map(([id, label, icon]) => (
            <button key={id} className={`bn-item${section === id ? ' active' : ''}`} onClick={() => setSection(id)}>
              {icon}
              <span className="bn-label">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Announcement detail modal */}
      {selectedAnn && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedAnn(null); }}
        >
          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, maxWidth: 440, width: '100%', maxHeight: '80vh', overflow: 'auto', boxShadow: 'var(--shadow-lg)', animation: 'modalIn 0.25s var(--ease-out)', position: 'relative' }}>
            <button
              onClick={() => setSelectedAnn(null)}
              style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
            {selectedAnn.pinned && <span className="badge badge-gold" style={{ fontSize: '0.68rem', marginBottom: 8, display: 'inline-flex' }}>📌 ปักหมุด</span>}
            <h3 style={{ marginBottom: 8, paddingRight: 32 }}>{selectedAnn.title}</h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: 14 }}>
              {selectedAnn.createdAt?.toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' })}
            </div>
            {selectedAnn.body && (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{selectedAnn.body}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
