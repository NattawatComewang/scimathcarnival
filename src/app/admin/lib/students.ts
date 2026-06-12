import type { Student } from './types';

// Case-insensitive match across name, nickname, room and student id.
export function matchStudent(s: Student, query: string): boolean {
  const q = query.toLowerCase();
  if (!q) return true;
  return (
    `${s.firstname} ${s.lastname}`.toLowerCase().includes(q) ||
    !!s.nickname?.toLowerCase().includes(q) ||
    !!s.room?.toLowerCase().includes(q) ||
    !!s.studentId?.includes(q)
  );
}
