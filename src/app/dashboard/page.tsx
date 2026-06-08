'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, query, orderBy, getDocs, limit, Timestamp } from 'firebase/firestore';
import { db, SUPER_ADMIN } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import DashboardSidebar, { DashboardSection } from '@/components/DashboardSidebar';
import AvatarPicker from '@/components/AvatarPicker';
import { getInitials } from '@/lib/utils';
import { Home, Layers, Users, Calendar, User, Lock, Bell, QrCode, ClipboardCheck, ChevronRight, LayoutDashboard } from 'lucide-react';

interface StudentData {
  firstname?: string;
  lastname?: string;
  nickname?: string;
  room?: string;
  studentId?: string;
  phone?: string;
  lineId?: string;
  instagram?: string;
  allergies?: string;
  healthNote?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  photoURL?: string;
  registered?: boolean;
  checkedIn?: boolean;
  groupId?: string;
}

interface Announcement { id: string; title: string; createdAt: Date | null; }

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [section, setSection] = useState<DashboardSection>('home');
  const [student, setStudent] = useState<StudentData | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<StudentData>>({});

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    // Load student data
    getDoc(doc(db, 'students', user.uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data() as StudentData;
        setStudent(data);
        setAvatarUrl(data.photoURL || user.photoURL || null);
        setEditForm({ nickname: data.nickname, phone: data.phone, lineId: data.lineId, instagram: data.instagram, allergies: data.allergies, healthNote: data.healthNote, emergencyName: data.emergencyName, emergencyPhone: data.emergencyPhone });
      } else {
        setAvatarUrl(user.photoURL || null);
      }
    });
    // Load announcements
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(5));
    getDocs(q).then((snap) => {
      setAnnouncements(snap.docs.map((d) => {
        const data = d.data();
        const ts = data.createdAt as Timestamp | null;
        return { id: d.id, title: data.title || '-', createdAt: ts?.toDate() ?? null };
      }));
    });
  }, [user]);

  async function saveProfile() {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'students', user.uid), { ...editForm });
      setStudent((prev) => prev ? { ...prev, ...editForm } : prev);
      setEditMode(false);
      showToast('บันทึกข้อมูลเรียบร้อย');
    } catch { showToast('เกิดข้อผิดพลาด', 'error'); }
  }

  if (loading || !user) return null;

  const isAdmin = user.email === SUPER_ADMIN;
  const displayName = student?.firstname ? `${student.firstname} ${student.lastname}` : user.displayName || '';
  const initials = getInitials(displayName || user.email || '');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      <DashboardSidebar activeSection={section} onSectionChange={setSection} isAdmin={isAdmin} />

      <div className="main-content">
        {/* Top bar */}
        <div className="topbar">
          <div className="topbar-title">
            {section === 'home' ? 'หน้าหลัก' : section === 'group' ? 'กลุ่มของฉัน' : section === 'duo' ? 'กลุ่ม Trio' : section === 'activity' ? 'กิจกรรม' : section === 'profile' ? 'โปรไฟล์' : 'บัตรเข้างาน'}
          </div>
          <div className="topbar-right">
            {isAdmin && (
              <button className="btn btn-sm" onClick={() => router.push('/admin')} style={{ background: 'var(--amber-dim)', color: 'var(--amber)', border: '1px solid var(--amber-dim)' }}>
                <LayoutDashboard style={{ width: 12, height: 12 }} /> Admin
              </button>
            )}
            <div className="top-av-wrap" onClick={() => setSection('profile')}>
              <div id="top-avatar">
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" />
                  : initials}
              </div>
            </div>
          </div>
        </div>

        {/* ── HOME ── */}
        {section === 'home' && (
          <div className="page-section active">
            <div className="greeting">
              <div className="greeting-name">สวัสดี, {student?.nickname || displayName || 'น้องใหม่'}!</div>
              <div className="greeting-sub">ยินดีต้อนรับสู่ระบบกิจกรรมรับน้อง CARNIVAL 89</div>
            </div>

            <div className="status-row">
              <div className="status-mini">
                <div className="status-mini-label"><ClipboardCheck style={{ width: 11, height: 11 }} /> ลงทะเบียน</div>
                <div>{student?.registered
                  ? <span className="badge badge-green">เรียบร้อย</span>
                  : <span className="badge badge-muted">ยังไม่ได้</span>}
                </div>
              </div>
              <div className="status-mini">
                <div className="status-mini-label"><Users style={{ width: 11, height: 11 }} /> เช็คอิน</div>
                <div>{student?.checkedIn
                  ? <span className="badge badge-green">เช็คอินแล้ว</span>
                  : <span className="badge badge-muted">ยังไม่ได้</span>}
                </div>
              </div>
            </div>

            {!student?.registered && (
              <a className="btn btn-primary" href="/register" style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}>
                ลงทะเบียนเข้าร่วมกิจกรรม
              </a>
            )}

            <div className="d-card">
              <div className="d-card-label"><Bell style={{ width: 12, height: 12 }} /> ประกาศล่าสุด</div>
              {announcements.length === 0
                ? <div className="text-sm text-muted">ยังไม่มีประกาศ</div>
                : announcements.map((a) => (
                  <div key={a.id} className="ann-item" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div className="ann-dot" />
                    <div className="ann-text" style={{ fontSize: '0.85rem' }}>{a.title}</div>
                    <div className="ann-date">{a.createdAt?.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) || ''}</div>
                    <ChevronRight style={{ width: 12, height: 12, color: 'var(--text-3)' }} />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── GROUP ── */}
        {section === 'group' && (
          <div className="page-section active">
            <div className="section-header"><h2>กลุ่มของฉัน</h2></div>
            <div className="d-card" style={{ textAlign: 'center', padding: '36px 20px' }}>
              <Lock style={{ width: 28, height: 28, color: 'var(--text-3)', marginBottom: 12 }} />
              <div style={{ fontWeight: 700, marginBottom: 6 }}>รอประกาศกลุ่ม</div>
              <div className="text-sm text-muted">พี่ๆ จะประกาศกลุ่มเร็วๆ นี้</div>
            </div>
          </div>
        )}

        {/* ── DUO/TRIO ── */}
        {section === 'duo' && (
          <div className="page-section active">
            <div className="section-header"><h2>กลุ่ม Trio</h2></div>
            <div className="d-card" style={{ textAlign: 'center', padding: '36px 20px' }}>
              <Lock style={{ width: 28, height: 28, color: 'var(--text-3)', marginBottom: 12 }} />
              <div style={{ fontWeight: 700, marginBottom: 6 }}>รอประกาศกลุ่ม Trio</div>
              <div className="text-sm text-muted">ระบบจะจับคู่ Trio ก่อนวันงาน</div>
            </div>
          </div>
        )}

        {/* ── ACTIVITY ── */}
        {section === 'activity' && (
          <div className="page-section active">
            <div className="section-header"><h2>รายละเอียดกิจกรรม</h2></div>
            <div className="d-card" style={{ textAlign: 'center', padding: '36px 20px' }}>
              <Lock style={{ width: 28, height: 28, color: 'var(--accent)', marginBottom: 12 }} />
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 6 }}>Coming Soon</div>
              <div className="text-sm text-muted" style={{ marginBottom: 20, lineHeight: 1.7 }}>
                รายละเอียดกิจกรรมจะเปิดเผย<br />ก่อนวันงาน 27 มิ.ย. 2569
              </div>
              <a className="btn btn-secondary" href="/event" style={{ justifyContent: 'center' }}>ดูหน้ากิจกรรม</a>
            </div>
          </div>
        )}

        {/* ── PASS ── */}
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

        {/* ── PROFILE ── */}
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
                  {[
                    ['ชื่อเล่น', student?.nickname],
                    ['ห้องเรียน', student?.room],
                    ['เลขประจำตัว', student?.studentId],
                    ['เบอร์โทร', student?.phone],
                    ['Line ID', student?.lineId],
                    ['Instagram', student?.instagram],
                  ].map(([label, value]) => value ? (
                    <div key={label as string} className="profile-row">
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
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={saveProfile}>บันทึก</button>
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
            ['home', 'หน้าหลัก', <Home style={{ width: 20, height: 20 }} />],
            ['group', 'กลุ่ม', <Layers style={{ width: 20, height: 20 }} />],
            ['duo', 'Trio', <Users style={{ width: 20, height: 20 }} />],
            ['activity', 'กิจกรรม', <Calendar style={{ width: 20, height: 20 }} />],
            ['profile', 'โปรไฟล์', <User style={{ width: 20, height: 20 }} />],
          ] as [DashboardSection, string, React.ReactNode][]).map(([id, label, icon]) => (
            <button key={id} className={`bn-item${section === id ? ' active' : ''}`} onClick={() => setSection(id)}>
              {icon}
              <span className="bn-label">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
