'use client';
import { useRef, useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { storage, db, auth } from '@/lib/firebase';
import { Camera } from 'lucide-react';

interface Props {
  uid: string;
  children: React.ReactNode;
  onUploaded: (url: string) => void;
  onError: (msg: string) => void;
}

function resizeImage(file: File, maxSize: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target?.result as string; };
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > h) { if (w > maxSize) { h = h * (maxSize / w); w = maxSize; } }
      else        { if (h > maxSize) { w = w * (maxSize / h); h = maxSize; } }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.88);
    };
    reader.readAsDataURL(file);
  });
}

export default function AvatarPicker({ uid, children, onUploaded, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { onError('กรุณาเลือกไฟล์รูปภาพเท่านั้น'); return; }
    if (file.size > 2 * 1024 * 1024)    { onError('ขนาดไฟล์ต้องไม่เกิน 2MB'); return; }

    setUploading(true);
    try {
      const resized    = await resizeImage(file, 256);
      const storageRef = ref(storage, `avatars/${uid}`);
      await uploadBytes(storageRef, resized, { contentType: 'image/jpeg' });
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'students', uid), { photoURL: url });
      if (auth.currentUser) await updateProfile(auth.currentUser, { photoURL: url });
      onUploaded(url);
    } catch (err: unknown) {
      onError('เกิดข้อผิดพลาด: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }} onClick={() => inputRef.current?.click()}>
      {children}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: uploading ? 'rgba(0,0,0,0.45)' : undefined,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: uploading ? 1 : 0, transition: 'opacity 0.2s',
      }}
        className="avatar-overlay"
      >
        <Camera style={{ width: 18, height: 18, color: 'white' }} />
      </div>
      <style>{`.avatar-picker-wrap:hover .avatar-overlay{opacity:1!important}`}</style>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  );
}
