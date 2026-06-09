'use client';
import { useEffect, useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { auth, googleProvider, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/components/Toast';
import { Moon, Sun, ShieldAlert, AlertTriangle, Eye, EyeOff, Lock, Mail } from 'lucide-react';

type LoginMode = 'student' | 'staff';

function isInAppBrowser() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Line\/|Instagram|FBAN|FBAV|Twitter|MicroMessenger|WhatsApp|Snapchat/i.test(ua);
}

function isLineBrowser() {
  if (typeof navigator === 'undefined') return false;
  return /Line\//i.test(navigator.userAgent);
}

export default function LoginPage() {
  const { user, loading } = useAuth();
  const { theme, toggle } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();

  const [signing, setSigning]       = useState(false);
  const [mode, setMode]             = useState<LoginMode>('student');
  const [inApp, setInApp]           = useState(false);
  const [isLine, setIsLine]         = useState(false);

  // Staff password login
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPass, setStaffPass]   = useState('');
  const [showPass, setShowPass]     = useState(false);

  // Role-choice modal (appears when Google user is also in staffAccounts)
  const [roleModal, setRoleModal]   = useState<{ uid: string; email: string } | null>(null);

  useEffect(() => {
    if (!loading && user && !roleModal) router.replace('/dashboard');
    setInApp(isInAppBrowser());
    setIsLine(isLineBrowser());
  }, [user, loading, router, roleModal]);

  async function handleGoogleSignIn() {
    setSigning(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const u = result.user;

      // Check if this user is also in staffAccounts
      const q = query(collection(db, 'staffAccounts'), where('email', '==', u.email), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty && snap.docs[0].data().active) {
        setRoleModal({ uid: u.uid, email: u.email ?? '' });
        return;
      }
      router.push('/dashboard');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/popup-closed-by-user') {
        showToast('ยกเลิกการเข้าสู่ระบบ', 'error');
      } else if (code === 'auth/user-cancelled') {
        showToast('กรุณาใช้บัญชี @student.triamudom.ac.th', 'error');
      } else {
        showToast('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
      }
    } finally {
      setSigning(false);
    }
  }

  async function handleStaffLogin() {
    if (!staffEmail.trim() || !staffPass) return;
    setSigning(true);
    try {
      await signInWithEmailAndPassword(auth, staffEmail.trim(), staffPass);
      router.push('/admin');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        showToast('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 'error');
      } else {
        showToast('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
      }
    } finally {
      setSigning(false);
    }
  }

  if (loading) return null;

  // In-app browser warning (LINE-specific copy with steps; generic message for others)
  if (inApp) {
    return (
      <div className="line-warning show">
        <div className="line-warning-icon">
          <AlertTriangle style={{ width: 32, height: 32, color: 'var(--amber)' }} />
        </div>
        <h2>กรุณาเปิดในเบราว์เซอร์</h2>
        <p>การเข้าสู่ระบบด้วย Google ไม่รองรับในแอปนี้<br />กรุณาเปิดลิงก์ใน Safari หรือ Chrome</p>
        {isLine && (
          <div className="line-steps">
            <div className="line-step"><div className="line-step-num">1</div><div>กดปุ่ม ··· หรือเมนูด้านบนขวา</div></div>
            <div className="line-step"><div className="line-step-num">2</div><div>เลือก "เปิดในเบราว์เซอร์" หรือ "Open in Browser"</div></div>
            <div className="line-step"><div className="line-step-num">3</div><div>เข้าสู่ระบบด้วย Google ได้เลย</div></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
        {/* Theme toggle */}
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 200 }}>
          <button className="theme-toggle" onClick={toggle} title="สลับธีม">
            <span className="icon-moon"><Moon style={{ width: 15, height: 15 }} /></span>
            <span className="icon-sun"><Sun style={{ width: 15, height: 15 }} /></span>
          </button>
        </div>

        {/* Header */}
        <div className="login-header">
          <div className="login-logo">
            <img src="/logo.png" alt="SciMath TU" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <h1>เข้าสู่ระบบ</h1>
          <p>ระบบกิจกรรมรับน้อง SciMath TU</p>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'var(--bg-2)', borderRadius: 'var(--radius)', padding: 4 }}>
          {(['student', 'staff'] as LoginMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '8px 28px', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 500,
                background: mode === m ? 'var(--bg-1)' : 'transparent',
                color: mode === m ? 'var(--text)' : 'var(--text-3)',
                boxShadow: mode === m ? 'var(--shadow)' : 'none',
                transition: 'all 0.14s',
              }}
            >
              {m === 'student' ? 'นักเรียน' : 'บุคลากร'}
            </button>
          ))}
        </div>

        {/* Student sign-in */}
        {mode === 'student' && (
          <div className="auth-box" style={{ margin: '0 auto' }}>
            <div className="auth-box-icon" style={{ background: 'var(--accent-dim)' }}>
              <ShieldAlert style={{ width: 28, height: 28, color: 'var(--accent)' }} />
            </div>
            <h2>นักเรียน</h2>
            <p>ใช้บัญชี <strong>@student.triamudom.ac.th</strong> เข้าสู่ระบบ</p>

            <button className="btn-google" onClick={handleGoogleSignIn} disabled={signing}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {signing ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google'}
            </button>

            <p className="modal-note">
              <ShieldAlert style={{ width: 12, height: 12 }} />
              เฉพาะบัญชี @student.triamudom.ac.th เท่านั้น
            </p>
            <a className="back-home" href="/">← กลับหน้าหลัก</a>
          </div>
        )}

        {/* Staff sign-in */}
        {mode === 'staff' && (
          <div className="auth-box" style={{ margin: '0 auto' }}>
            <div className="auth-box-icon" style={{ background: 'var(--amber-dim)' }}>
              <Lock style={{ width: 28, height: 28, color: 'var(--amber)' }} />
            </div>
            <h2>บุคลากร</h2>
            <p>เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-3)' }} />
                <input
                  className="form-input"
                  type="email"
                  placeholder="อีเมล"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  style={{ paddingLeft: 36 }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleStaffLogin(); }}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-3)' }} />
                <input
                  className="form-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="รหัสผ่าน"
                  value={staffPass}
                  onChange={(e) => setStaffPass(e.target.value)}
                  style={{ paddingLeft: 36, paddingRight: 40 }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleStaffLogin(); }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showPass ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                </button>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleStaffLogin}
              disabled={signing || !staffEmail || !staffPass}
            >
              {signing ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>

            <a className="back-home" href="/">← กลับหน้าหลัก</a>
          </div>
        )}
      </div>

      {/* Role-choice modal */}
      {roleModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={(e) => { if (e.target === e.currentTarget) { setRoleModal(null); router.push('/dashboard'); } }}
        >
          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '28px 32px', maxWidth: 360, width: '100%', boxShadow: 'var(--shadow-lg)', animation: 'modalIn 0.28s var(--ease-out)' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: 6 }}>เข้าสู่ระบบในฐานะ?</div>
              <div style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>{roleModal.email}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                className="btn btn-primary"
                style={{ justifyContent: 'center', gap: 8 }}
                onClick={() => { setRoleModal(null); router.push('/dashboard'); }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                นักเรียน
              </button>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'center', gap: 8 }}
                onClick={() => { setRoleModal(null); router.push('/admin'); }}
              >
                <ShieldAlert style={{ width: 15, height: 15 }} />
                บุคลากร / Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
