'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/components/Toast';
import type { LogEntry } from '../lib/types';

export default function LogsSection() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, 'auditLogs'), orderBy('at', 'desc'), limit(50));
        const snap = await getDocs(q);
        setLogs(snap.docs.map((d) => {
          const data = d.data();
          const ts = data.at as Timestamp | null;
          return { id: d.id, action: data.action, detail: data.detail, by: data.by, at: ts?.toDate() ?? null };
        }));
      } catch { showToast('โหลดข้อมูลล้มเหลว', 'error'); }
    })();
  }, [showToast]);

  return (
    <>
      <div className="page-title"><h2>Audit Logs</h2></div>
      <div className="d-card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-3)' }}>
              {['เวลา', 'ผู้ดำเนินการ', 'Action', 'รายละเอียด'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 6px', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.82rem' }}>
                <td style={{ padding: '8px 6px', color: 'var(--text-3)' }}>{l.at?.toLocaleString('th-TH') || '-'}</td>
                <td style={{ padding: '8px 6px' }}>{l.by}</td>
                <td style={{ padding: '8px 6px' }}><span className="badge badge-muted">{l.action}</span></td>
                <td style={{ padding: '8px 6px' }}>{l.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
