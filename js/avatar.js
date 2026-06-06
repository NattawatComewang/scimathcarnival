// ── AVATAR UPLOAD MODULE ───────────────────────────────
import { getStorage, ref, uploadBytes, getDownloadURL }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getFirestore, doc, updateDoc }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, updateProfile }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

export async function uploadAvatar(app, file, uid, onSuccess, onError) {
  try {
    // Validate
    if (!file.type.startsWith('image/')) {
      onError('กรุณาเลือกไฟล์รูปภาพเท่านั้น'); return;
    }
    if (file.size > 2 * 1024 * 1024) {
      onError('ขนาดไฟล์ต้องไม่เกิน 2MB'); return;
    }

    const storage = getStorage(app);
    const db      = getFirestore(app);
    const auth    = getAuth(app);

    // Resize ก่อน upload
    const resized = await resizeImage(file, 256);

    // Upload
    const storageRef = ref(storage, `avatars/${uid}`);
    await uploadBytes(storageRef, resized, { contentType: 'image/jpeg' });
    const url = await getDownloadURL(storageRef);

    // Update Firestore + Auth profile
    await updateDoc(doc(db, 'students', uid), { photoURL: url });
    if (auth.currentUser) await updateProfile(auth.currentUser, { photoURL: url });

    onSuccess(url);
  } catch(e) {
    onError('เกิดข้อผิดพลาด: ' + e.message);
  }
}

// Resize image to maxSize x maxSize using canvas
function resizeImage(file, maxSize) {
  return new Promise((resolve) => {
    const img    = new Image();
    const reader = new FileReader();
    reader.onload = e => { img.src = e.target.result; };
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > h) { if (w > maxSize) { h = h*(maxSize/w); w = maxSize; } }
      else        { if (h > maxSize) { w = w*(maxSize/h); h = maxSize; } }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.88);
    };
    reader.readAsDataURL(file);
  });
}

// ── AVATAR PICKER UI ─────────────────────────────────
// inject ปุ่มเปลี่ยนรูปบน element ใดก็ได้
export function makeAvatarPicker(containerEl, uid, app, onUploaded) {
  containerEl.style.position = 'relative';
  containerEl.style.cursor   = 'pointer';

  // Overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:absolute; inset:0; border-radius:50%;
    background:rgba(0,0,0,0.45); display:flex;
    align-items:center; justify-content:center;
    opacity:0; transition:opacity 0.2s; cursor:pointer;
  `;
  overlay.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>`;

  containerEl.addEventListener('mouseenter', () => overlay.style.opacity = '1');
  containerEl.addEventListener('mouseleave', () => overlay.style.opacity = '0');
  containerEl.appendChild(overlay);

  // Hidden file input
  const input = document.createElement('input');
  input.type   = 'file';
  input.accept = 'image/*';
  input.style.display = 'none';
  document.body.appendChild(input);

  containerEl.onclick = () => input.click();

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    overlay.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="white" stroke-width="2" stroke-linecap="round">
      <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32">
        <animate attributeName="stroke-dashoffset" from="32" to="0" dur="0.8s" fill="freeze"/>
      </circle></svg>`;
    overlay.style.opacity = '1';

    await uploadAvatar(app, file, uid,
      (url) => {
        overlay.style.opacity = '0';
        overlay.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="white" stroke-width="2" stroke-linecap="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/></svg>`;
        onUploaded(url);
        input.value = '';
      },
      (err) => {
        overlay.style.opacity = '0';
        overlay.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="white" stroke-width="2" stroke-linecap="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/></svg>`;
        alert(err);
        input.value = '';
      }
    );
  };
}
