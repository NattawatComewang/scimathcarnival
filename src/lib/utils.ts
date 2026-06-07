export function getInitials(name = '') {
  const parts = name.trim().split(' ');
  return parts.length > 1 ? parts[0][0] + parts[1][0] : (name[0] || '?');
}

export async function logAudit(action: string, detail: string) {
  const { auth, db } = await import('./firebase');
  const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
  const user = auth.currentUser;
  if (!user) return;
  try {
    await addDoc(collection(db, 'auditLogs'), {
      action, detail, by: user.email, at: serverTimestamp(),
    });
  } catch (_) {}
}
