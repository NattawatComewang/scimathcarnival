// ── FIREBASE CONFIG ────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, getDocs, serverTimestamp, limit }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDtuK_Rvq9Ki3QiytCTWON6S4J2iHKlTCU",
  authDomain: "rubnong-official.firebaseapp.com",
  projectId: "rubnong-official",
  storageBucket: "rubnong-official.firebasestorage.app",
  messagingSenderId: "982944596814",
  appId: "1:982944596814:web:cf61c860632eb42b4a541f"
};

export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
export const provider = (() => {
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ hd: 'student.triamudom.ac.th' });
  return p;
})();

export const SUPER_ADMIN = '8868278@student.triamudom.ac.th';

// re-export firebase functions for convenience
export { signInWithPopup, signOut, onAuthStateChanged,
  doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, getDocs, serverTimestamp, limit };

// ── UTILS ──────────────────────────────────────────────
export function showToast(msg, type = 'success') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const color = type === 'success' ? 'var(--green)' : 'var(--red)';
  const icon  = type === 'success' ? 'check-circle' : 'alert-circle';
  t.innerHTML = `<i data-lucide="${icon}" style="width:16px;height:16px;color:${color};flex-shrink:0"></i><span>${msg}</span>`;
  c.appendChild(t);
  lucide.createIcons();
  setTimeout(() => t.remove(), 3500);
}

export function getInitials(name = '') {
  const parts = name.trim().split(' ');
  return parts.length > 1 ? parts[0][0] + parts[1][0] : (name[0] || '?');
}

export async function logAudit(action, detail) {
  const user = auth.currentUser;
  if (!user) return;
  try {
    await addDoc(collection(db, 'auditLogs'), {
      action, detail, by: user.email, at: serverTimestamp()
    });
  } catch (_) {}
}

// ── NAV SHARED ─────────────────────────────────────────
export function renderNav(activePage) {
  const pages = {
    home:      'index.html',
    committee: 'committee.html',
    event:     'event.html',
  };
  const nav = document.getElementById('public-nav');
  if (!nav) return;

  const isLoggedIn = !!auth.currentUser;

  nav.innerHTML = `
    <div class="nav-inner">
      <a class="nav-logo" href="index.html">
        <div class="nav-logo-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        SciMath TU
      </a>
      <div class="nav-links">
        <a class="nav-link ${activePage==='home'?'active':''}" href="index.html">หน้าแรก</a>
        <a class="nav-link ${activePage==='committee'?'active':''}" href="committee.html">บุคลากร</a>
        <a class="nav-link ${activePage==='event'?'active':''}" href="event.html">รับน้อง</a>
      </div>
      <div class="flex items-center gap-2">
        ${isLoggedIn
          ? `<a class="btn btn-secondary btn-sm" href="dashboard.html">
               <i data-lucide="layout-dashboard" style="width:14px;height:14px"></i> Dashboard
             </a>`
          : `<a class="btn btn-primary btn-sm" href="login.html">
               <i data-lucide="log-in" style="width:14px;height:14px"></i> เข้าสู่ระบบ
             </a>`}
        <button class="hamburger" onclick="toggleMobileMenu()">
          <i data-lucide="menu" style="width:20px;height:20px"></i>
        </button>
      </div>
    </div>`;

  lucide.createIcons();
}

window.toggleMobileMenu = () =>
  document.getElementById('mobile-menu')?.classList.toggle('open');
