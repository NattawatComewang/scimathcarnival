'use client';
import type { Counts, Student } from '../lib/types';

interface Props {
  students: Student[];
  counts: Counts;
}

export default function OverviewSection({ students, counts }: Props) {
  return (
    <>
      <div className="page-title"><h2>Overview</h2><p>ภาพรวมระบบ</p></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'นักเรียนทั้งหมด', value: counts.students,   color: 'var(--accent)' },
          { label: 'ลงทะเบียนแล้ว',   value: counts.registered, color: 'var(--green)' },
          { label: 'เช็คอินแล้ว',      value: counts.checkedIn,  color: 'var(--blue)' },
        ].map((stat) => (
          <div key={stat.label} className="d-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>
      <div className="d-card">
        <div className="d-card-label">ลงทะเบียนล่าสุด</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-3)' }}>
              <th style={{ textAlign: 'left', padding: '8px 4px' }}>ชื่อ</th>
              <th style={{ textAlign: 'left', padding: '8px 4px' }}>ห้อง</th>
              <th style={{ textAlign: 'left', padding: '8px 4px' }}>เช็คอิน</th>
            </tr>
          </thead>
          <tbody>
            {students.filter((s) => s.registered).slice(0, 10).map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                <td style={{ padding: '8px 4px' }}>{s.firstname} {s.lastname}</td>
                <td style={{ padding: '8px 4px' }}>{s.room}</td>
                <td style={{ padding: '8px 4px' }}>
                  {s.checkedIn ? <span className="badge badge-green">✓</span> : <span className="badge badge-muted">-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
