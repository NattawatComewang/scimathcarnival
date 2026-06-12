'use client';
import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { useToast } from '@/components/Toast';
import type { Counts, Student } from '../lib/types';
import { downloadCSV } from '../lib/csv';

interface Props {
  students: Student[];
  counts: Counts;
}

export default function ExportSection({ students, counts }: Props) {
  const { showToast } = useToast();
  const [exportLoading, setExportLoading] = useState(false);

  function exportAll() {
    setExportLoading(true);
    const headers = ['ชื่อ', 'นามสกุล', 'ชื่อเล่น', 'ห้อง', 'เลขประจำตัว', 'อีเมล', 'เบอร์โทร', 'ลงทะเบียน', 'เช็คอิน'];
    const rows = students.map((s) => [
      s.firstname ?? '', s.lastname ?? '', s.nickname ?? '',
      s.room ?? '', s.studentId ?? '', s.email ?? '', s.phone ?? '',
      s.registered ? 'ใช่' : 'ไม่', s.checkedIn ? 'ใช่' : 'ไม่',
    ]);
    downloadCSV('students.csv', headers, rows);
    setExportLoading(false);
    showToast('ดาวน์โหลดแล้ว');
  }

  function exportRegistered() {
    const registered = students.filter((s) => s.registered);
    const headers = ['ชื่อ', 'นามสกุล', 'ชื่อเล่น', 'ห้อง', 'เลขประจำตัว', 'เช็คอิน'];
    const rows = registered.map((s) => [s.firstname ?? '', s.lastname ?? '', s.nickname ?? '', s.room ?? '', s.studentId ?? '', s.checkedIn ? 'ใช่' : 'ไม่']);
    downloadCSV('registered.csv', headers, rows);
    showToast('ดาวน์โหลดแล้ว');
  }

  return (
    <>
      <div className="page-title"><h2>Export</h2><p>ส่งออกข้อมูล</p></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
        <div className="d-card">
          <div style={{ fontWeight: 600, marginBottom: 6 }}>นักเรียนทั้งหมด (CSV)</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: 14 }}>ชื่อ, ห้อง, เลขประจำตัว, การลงทะเบียน, เช็คอิน</div>
          <button className="btn btn-primary btn-sm" onClick={exportAll} disabled={exportLoading}>
            <FileDown className="w-3.5 h-3.5" /> ดาวน์โหลด CSV
          </button>
        </div>
        <div className="d-card">
          <div style={{ fontWeight: 600, marginBottom: 6 }}>รายชื่อลงทะเบียน (CSV)</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: 14 }}>เฉพาะนักเรียนที่ลงทะเบียนแล้ว {counts.registered} คน</div>
          <button className="btn btn-secondary btn-sm" onClick={exportRegistered}>
            <FileDown className="w-3.5 h-3.5" /> รายชื่อลงทะเบียน
          </button>
        </div>
      </div>
    </>
  );
}
