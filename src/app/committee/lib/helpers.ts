import type { Member } from './types';

export function memberName(m: Member) {
  if (m.firstName || m.lastName) return `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim();
  return m.name ?? 'ไม่ระบุชื่อ';
}

export function memberPhotos(m: Member): string[] {
  const list: string[] = [];
  if (m.photoURL) list.push(m.photoURL);
  m.photos?.forEach((p) => { if (p && !list.includes(p)) list.push(p); });
  return list;
}
