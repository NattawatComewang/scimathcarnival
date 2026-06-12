'use client';
import { useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Counts, Student } from '../lib/types';
import { matchStudent } from '../lib/students';

interface Props {
  students: Student[];
  counts: Counts;
  onToggleCheckin: (id: string, cur: boolean) => void | Promise<void>;
}

export default function CheckinSection({ students, counts, onToggleCheckin }: Props) {
  const [ciSearch, setCiSearch] = useState('');
  const ciStudents = students.filter((s) => matchStudent(s, ciSearch));

  return (
    <>
      <div className="page-title"><h2>Check-in</h2><p>เช็คอิน {counts.checkedIn}/{counts.students} คน</p></div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
          <Search className="w-3.5 h-3.5" style={{ color: 'var(--text-3)', flexShrink: 0 }} />
          <input style={{ border: 'none', background: 'none', outline: 'none', color: 'var(--text)', fontSize: '0.9rem', width: '100%' }} placeholder="ค้นหาชื่อ ห้อง เลขประจำตัว..." value={ciSearch} onChange={(e) => setCiSearch(e.target.value)} autoFocus />
          {ciSearch && <button onClick={() => setCiSearch('')} style={{ color: 'var(--text-3)' }}><X className="w-[13px] h-[13px]" /></button>}
        </div>
      </div>

      <div className="d-card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-3)' }}>
              {['ชื่อ-นามสกุล', 'ห้อง', 'เลขประจำตัว', 'สถานะ'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 8px', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ciStudents.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                <td style={{ padding: '8px 8px' }}>{s.firstname} {s.lastname} {s.nickname ? `(${s.nickname})` : ''}</td>
                <td style={{ padding: '8px 8px' }}>{s.room}</td>
                <td style={{ padding: '8px 8px' }}>{s.studentId}</td>
                <td style={{ padding: '8px 8px' }}>
                  <button
                    className={`badge ${s.checkedIn ? 'badge-green' : 'badge-muted'}`}
                    style={{ cursor: 'pointer', border: 'none', minWidth: 80 }}
                    onClick={() => onToggleCheckin(s.id, !!s.checkedIn)}
                  >
                    {s.checkedIn ? '✓ เช็คอินแล้ว' : '+ เช็คอิน'}
                  </button>
                </td>
              </tr>
            ))}
            {ciStudents.length === 0 && (
              <tr><td colSpan={4} style={{ padding: '20px 8px', textAlign: 'center', color: 'var(--text-3)' }}>ไม่พบนักเรียน</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
