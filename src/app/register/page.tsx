'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/components/Toast';
import { Moon, Sun, ShieldCheck, FileText, User, HeartPulse, Brain, ClipboardList, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';

const TOTAL_STAGES = 7;

interface FormData {
  room: string;
  consent1: boolean;
  consent2: boolean;
  firstname: string;
  lastname: string;
  nickname: string;
  studentId: string;
  phone: string;
  lineId: string;
  instagram: string;
  allergies: string;
  healthNote: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
}

const STAGE_ICONS = [
  <ShieldCheck style={{ width: 28, height: 28, color: 'var(--accent)' }} />,
  <FileText style={{ width: 28, height: 28, color: 'var(--blue)' }} />,
  <User style={{ width: 28, height: 28, color: 'var(--accent)' }} />,
  <HeartPulse style={{ width: 28, height: 28, color: 'var(--red)' }} />,
  <Brain style={{ width: 28, height: 28, color: 'var(--accent)' }} />,
  <ClipboardList style={{ width: 28, height: 28, color: 'var(--accent)' }} />,
  <CheckCircle style={{ width: 28, height: 28, color: 'var(--green)' }} />,
];

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const { theme, toggle } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();

  const [stage, setStage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  const [form, setForm] = useState<FormData>({
    room: '', consent1: false, consent2: false,
    firstname: '', lastname: '', nickname: '', studentId: '', phone: '', lineId: '', instagram: '',
    allergies: '', healthNote: '', emergencyName: '', emergencyPhone: '', emergencyRelation: '',
  });

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    if (user) {
      getDoc(doc(db, 'students', user.uid)).then((snap) => {
        if (snap.exists() && snap.data()?.registered) setAlreadyRegistered(true);
      });
    }
  }, [user, loading, router]);

  function set(field: keyof FormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function canAdvance(): boolean {
    if (stage === 1) return form.room.length >= 2;
    if (stage === 2) return form.consent1 && form.consent2;
    if (stage === 3) return !!(form.firstname && form.lastname && form.nickname && form.studentId && form.phone && form.room);
    return true;
  }

  function next() { if (canAdvance() && stage < TOTAL_STAGES) setStage((s) => s + 1); }
  function back() { if (stage > 1) setStage((s) => s - 1); }

  async function handleSubmit() {
    if (!user) return;
    setSubmitting(true);
    try {
      await setDoc(doc(db, 'students', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        room: form.room,
        firstname: form.firstname,
        lastname: form.lastname,
        nickname: form.nickname,
        studentId: form.studentId,
        phone: form.phone,
        lineId: form.lineId,
        instagram: form.instagram,
        allergies: form.allergies,
        healthNote: form.healthNote,
        emergencyName: form.emergencyName,
        emergencyPhone: form.emergencyPhone,
        emergencyRelation: form.emergencyRelation,
        registered: true,
        registeredAt: serverTimestamp(),
      });
      setStage(TOTAL_STAGES);
      showToast('ลงทะเบียนสำเร็จ!');
    } catch (err) {
      showToast('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !user) return null;

  const progress = Math.round((stage / TOTAL_STAGES) * 100);

  if (alreadyRegistered && stage !== TOTAL_STAGES) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', padding: '80px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="success-box" style={{ width: '100%' }}>
          <div className="success-check">
            <CheckCircle style={{ width: 32, height: 32, color: 'white' }} />
          </div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>ลงทะเบียนแล้ว</div>
          <div style={{ color: 'var(--text-2)', fontSize: '0.875rem', marginBottom: 20 }}>คุณได้ลงทะเบียนแล้ว สามารถดูข้อมูลได้ใน Dashboard</div>
          <a className="btn btn-primary" href="/dashboard" style={{ width: '100%', justifyContent: 'center' }}>ไป Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', paddingBottom: 100, background: 'var(--bg)' }}>
      {/* Top bar */}
      <div className="top-bar">
        <div className="top-bar-logo">
          <img src="/logo.png" alt="logo" style={{ width: 26, height: 26 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          SciMath TU
        </div>
        <button className="theme-toggle" onClick={toggle} title="สลับธีม">
          <span className="icon-moon"><Moon style={{ width: 14, height: 14 }} /></span>
          <span className="icon-sun"><Sun style={{ width: 14, height: 14 }} /></span>
        </button>
      </div>

      {/* Progress */}
      {stage < TOTAL_STAGES && (
        <div className="progress-wrap">
          <div className="progress-header">
            <div className="progress-title">ลงทะเบียน CARNIVAL 89</div>
          </div>
          <div className="progress-row">
            <div className="progress-label">{stage} จาก {TOTAL_STAGES - 1}</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Stage 1: Eligibility */}
      {stage === 1 && (
        <div className="stage active">
          <div className="stage-icon" style={{ background: 'var(--accent-dim)' }}>{STAGE_ICONS[0]}</div>
          <div className="stage-title">ตรวจสอบสิทธิ์</div>
          <div className="stage-sub">กรอกเลขห้องเรียนเพื่อตรวจสอบสิทธิ์</div>
          <div className="s-card">
            <div className="form-group">
              <label className="form-label">เลขห้องเรียน <span className="required">*</span></label>
              <input className="form-input" value={form.room} onChange={(e) => set('room', e.target.value.replace(/[^0-9]/g, ''))} placeholder="เช่น 65, 278, 842" maxLength={4} inputMode="numeric" />
              <div className="form-hint">กรอกเลขห้อง เช่น 27, 65, 278, 842</div>
            </div>
          </div>
        </div>
      )}

      {/* Stage 2: Consent */}
      {stage === 2 && (
        <div className="stage active">
          <div className="stage-icon" style={{ background: 'var(--blue-dim)' }}>{STAGE_ICONS[1]}</div>
          <div className="stage-title">ข้อตกลงและความเป็นส่วนตัว</div>
          <div className="stage-sub">โปรดอ่านและยอมรับก่อนดำเนินการต่อ</div>
          {[
            'ข้อมูลที่กรอกจะถูกใช้เพื่อจัดกิจกรรมรับน้องเท่านั้น',
            'ข้อมูลสุขภาพใช้เพื่อความปลอดภัยในวันงานเท่านั้น',
            'ผลแบบสำรวจใช้จัดกลุ่มให้สมดุล ไม่ใช่ตัดสินตัวตน',
            'ข้อมูลทั้งหมดจะถูกลบหลังกิจกรรมสิ้นสุด',
          ].map((text, i) => (
            <div key={i} className="consent-item">
              <div className="consent-text">{text}</div>
            </div>
          ))}
          <div className="consent-check">
            <label><input type="checkbox" checked={form.consent1} onChange={(e) => set('consent1', e.target.checked)} /><span> ฉันยินยอมให้ใช้ข้อมูลส่วนตัวเพื่อจัดกิจกรรม</span></label>
          </div>
          <div className="consent-check" style={{ marginTop: 8 }}>
            <label><input type="checkbox" checked={form.consent2} onChange={(e) => set('consent2', e.target.checked)} /><span> ฉันเข้าใจว่าข้อมูลสุขภาพใช้เพื่อความปลอดภัยเท่านั้น</span></label>
          </div>
        </div>
      )}

      {/* Stage 3: Basic Profile */}
      {stage === 3 && (
        <div className="stage active">
          <div className="stage-icon" style={{ background: 'var(--accent-dim)' }}>{STAGE_ICONS[2]}</div>
          <div className="stage-title">ข้อมูลส่วนตัว</div>
          <div className="stage-sub">กรอกข้อมูลพื้นฐาน</div>
          <div className="s-card">
            <div className="f-stack">
              {[
                { id: 'firstname', label: 'ชื่อ', placeholder: 'ชื่อ', required: true },
                { id: 'lastname', label: 'นามสกุล', placeholder: 'นามสกุล', required: true },
                { id: 'nickname', label: 'ชื่อเล่น', placeholder: 'ชื่อเล่น', required: true },
                { id: 'studentId', label: 'เลขประจำตัวนักเรียน', placeholder: 'เลขประจำตัว', required: true, inputMode: 'numeric' as const },
                { id: 'phone', label: 'เบอร์โทรศัพท์', placeholder: '0xx-xxx-xxxx', required: true, type: 'tel' },
                { id: 'lineId', label: 'Line ID', placeholder: 'Line ID', required: false },
                { id: 'instagram', label: 'Instagram', placeholder: 'username', required: false },
              ].map((f) => (
                <div key={f.id} className="form-group">
                  <label className="form-label">{f.label} {f.required && <span className="required">*</span>}</label>
                  <input
                    className="form-input"
                    type={f.type || 'text'}
                    inputMode={f.inputMode}
                    placeholder={f.placeholder}
                    value={form[f.id as keyof FormData] as string}
                    onChange={(e) => set(f.id as keyof FormData, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stage 4: Health & Emergency */}
      {stage === 4 && (
        <div className="stage active">
          <div className="stage-icon" style={{ background: 'var(--red-dim)' }}>{STAGE_ICONS[3]}</div>
          <div className="stage-title">ข้อมูลสุขภาพและฉุกเฉิน</div>
          <div className="stage-sub">ใช้เพื่อความปลอดภัยในวันงานเท่านั้น</div>
          <div className="s-card">
            <div className="f-stack">
              <div className="form-group">
                <label className="form-label">อาการแพ้ / โรคประจำตัว</label>
                <textarea className="form-input" rows={3} placeholder="เช่น แพ้ถั่ว มีโรคหืด..." value={form.allergies} onChange={(e) => set('allergies', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">หมายเหตุสุขภาพอื่นๆ</label>
                <textarea className="form-input" rows={2} placeholder="ข้อมูลสุขภาพเพิ่มเติม..." value={form.healthNote} onChange={(e) => set('healthNote', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">ชื่อผู้ติดต่อฉุกเฉิน <span className="required">*</span></label>
                <input className="form-input" placeholder="ชื่อ-นามสกุลผู้ปกครอง" value={form.emergencyName} onChange={(e) => set('emergencyName', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">เบอร์โทรผู้ติดต่อฉุกเฉิน <span className="required">*</span></label>
                <input className="form-input" type="tel" placeholder="0xx-xxx-xxxx" value={form.emergencyPhone} onChange={(e) => set('emergencyPhone', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">ความสัมพันธ์</label>
                <input className="form-input" placeholder="เช่น พ่อ, แม่, พี่" value={form.emergencyRelation} onChange={(e) => set('emergencyRelation', e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage 5-6: placeholders for quiz/additional data */}
      {(stage === 5 || stage === 6) && (
        <div className="stage active">
          <div className="stage-icon" style={{ background: 'var(--accent-dim)' }}>{STAGE_ICONS[stage - 1]}</div>
          <div className="stage-title">{stage === 5 ? 'แบบสำรวจสไตล์การทำงาน' : 'ตรวจสอบข้อมูล'}</div>
          <div className="stage-sub">{stage === 5 ? 'ช่วยจัดกลุ่มให้สมดุล' : 'ตรวจสอบข้อมูลก่อนส่ง'}</div>
          {stage === 6 && (
            <div className="s-card">
              {[
                ['ชื่อ-นามสกุล', `${form.firstname} ${form.lastname}`],
                ['ชื่อเล่น', form.nickname],
                ['ห้องเรียน', form.room],
                ['เลขประจำตัว', form.studentId],
                ['เบอร์โทร', form.phone],
              ].map(([label, value]) => (
                <div key={label} className="review-row">
                  <div className="review-label">{label}</div>
                  <div className="review-value">{value || '-'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stage 7: Success */}
      {stage === TOTAL_STAGES && (
        <div className="stage active" style={{ alignItems: 'center', textAlign: 'center', paddingTop: 60 }}>
          <div className="success-box">
            <div className="success-check">
              <CheckCircle style={{ width: 32, height: 32, color: 'white' }} />
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: 8 }}>ลงทะเบียนสำเร็จ!</div>
            <div style={{ color: 'var(--text-2)', fontSize: '0.875rem', marginBottom: 20, lineHeight: 1.6 }}>
              ยินดีต้อนรับสู่กิจกรรมรับน้อง Sci-Math CARNIVAL 89<br />
              ติดตามประกาศกลุ่มได้ใน Dashboard
            </div>
            <a className="btn btn-primary" href="/dashboard" style={{ width: '100%', justifyContent: 'center' }}>
              ไป Dashboard
            </a>
          </div>
        </div>
      )}

      {/* Bottom navigation */}
      {stage < TOTAL_STAGES && (
        <div className="stage-footer">
          {stage > 1 && (
            <button className="btn btn-secondary" onClick={back}>
              <ChevronLeft style={{ width: 16, height: 16 }} /> ย้อนกลับ
            </button>
          )}
          {stage < TOTAL_STAGES - 1 && (
            <button className="btn btn-next-primary" onClick={next} disabled={!canAdvance()}>
              ถัดไป <ChevronRight style={{ width: 16, height: 16 }} />
            </button>
          )}
          {stage === TOTAL_STAGES - 1 && (
            <button className="btn btn-next-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'กำลังส่ง...' : 'ยืนยันลงทะเบียน'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
