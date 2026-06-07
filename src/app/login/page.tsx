'use client';
import { useEffect, useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth, googleProvider } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/components/Toast';
import { Moon, Sun, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const { theme, toggle } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const [signing, setSigning] = useState(false);
  const [isLineBrowser, setIsLineBrowser] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
    // Detect LINE in-app browser
    if (typeof navigator !== 'undefined' && /Line\//i.test(navigator.userAgent)) {
      setIsLineBrowser(true);
    }
  }, [user, loading, router]);

  async function handleGoogleSignIn() {
    setSigning(true);
    try {
      await signInWithPopup(auth, googleProvider);
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

  if (loading) return null;

  if (isLineBrowser) {
    return (
      <div className="line-warning show">
        <div className="line-warning-icon">
          <AlertTriangle style={{ width: 32, height: 32, color: 'var(--amber)' }} />
        </div>
        <h2>กรุณาเปิดในเบราว์เซอร์</h2>
        <p>การเข้าสู่ระบบด้วย Google ไม่รองรับใน LINE Browser<br />กรุณาเปิดลิงก์นี้ใน Safari หรือ Chrome แทน</p>
        <div className="line-steps">
          <div className="line-step">
            <div className="line-step-num">1</div>
            <div>กดปุ่ม ··· หรือเมนูด้านบนขวา</div>
          </div>
          <div className="line-step">
            <div className="line-step-num">2</div>
            <div>เลือก "เปิดในเบราว์เซอร์" หรือ "Open in Browser"</div>
          </div>
          <div className="line-step">
            <div className="line-step-num">3</div>
            <div>เข้าสู่ระบบด้วย Google ได้เลย</div>
          </div>
        </div>
      </div>
    );
  }

  return (
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
        <p>เข้าสู่ระบบด้วยบัญชี Google ของโรงเรียน</p>
      </div>

      {/* Google Sign-In Card */}
      <div className="auth-box" style={{ margin: '0 auto' }}>
        <div className="auth-box-icon" style={{ background: 'var(--accent-dim)' }}>
          <ShieldAlert style={{ width: 28, height: 28, color: 'var(--accent)' }} />
        </div>
        <h2>นักเรียน / บุคลากร</h2>
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

        <a className="back-home" href="/">
          ← กลับหน้าหลัก
        </a>
      </div>
    </div>
  );
}
