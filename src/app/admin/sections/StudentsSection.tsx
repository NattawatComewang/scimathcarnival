'use client';
import { useState } from 'react';
import { Search, X, Edit3, Trash2 } from 'lucide-react';
import type { Student } from '../lib/types';
import { matchStudent } from '../lib/students';

interface Props {
  students: Student[];
  onToggleCheckin: (id: string, cur: boolean) => void | Promise<void>;
  onSaveEdit: (id: string, form: Partial<Student>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function StudentsSection({ students, onToggleCheckin, onSaveEdit, onDelete }: Props) {
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editStudentForm, setEditStudentForm] = useState<Partial<Student>>({});
  const [editingStudent, setEditingStudent] = useState(false);

  function selectStudent(s: Student) {
    setSelectedStudent(s);
    setEditStudentForm({
      nickname: s.nickname, phone: s.phone, lineId: s.lineId, instagram: s.instagram,
      allergies: s.allergies, healthNote: s.healthNote, emergencyName: s.emergencyName, emergencyPhone: s.emergencyPhone,
    });
    setEditingStudent(false);
  }

  async function saveEdit() {
    if (!selectedStudent) return;
    await onSaveEdit(selectedStudent.id, editStudentForm);
    setSelectedStudent((s) => s ? { ...s, ...editStudentForm } : s);
    setEditingStudent(false);
  }

  async function deleteStudent(id: string) {
    if (!confirm('ลบนักเรียนคนนี้? ไม่สามารถย้อนกลับได้')) return;
    await onDelete(id);
    if (selectedStudent?.id === id) setSelectedStudent(null);
  }

  const filteredStudents = students.filter((s) => matchStudent(s, studentSearch));

  return (
    <>
      <div className="page-title"><h2>ข้อมูลนักเรียน</h2><p>{students.length} คน</p></div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
          <Search className="w-3.5 h-3.5" style={{ color: 'var(--text-3)', flexShrink: 0 }} />
          <input style={{ border: 'none', background: 'none', outline: 'none', color: 'var(--text)', fontSize: '0.9rem', width: '100%' }} placeholder="ค้นหาชื่อ ห้อง เลข..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
          {studentSearch && <button onClick={() => setStudentSearch('')} style={{ color: 'var(--text-3)' }}><X className="w-[13px] h-[13px]" /></button>}
        </div>
        {selectedStudent && (
          <button className="btn btn-sm btn-secondary" onClick={() => setSelectedStudent(null)}><X className="w-[13px] h-[13px]" /> ปิดพาเนล</button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedStudent ? '1fr 320px' : '1fr', gap: 14 }}>
        <div className="d-card" style={{ overflowX: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-3)' }}>
                {['ชื่อ-นามสกุล', 'ห้อง', 'เลขประจำตัว', 'ลงทะเบียน', 'เช็คอิน'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s) => (
                <tr
                  key={s.id}
                  style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem', cursor: 'pointer', background: selectedStudent?.id === s.id ? 'var(--accent-dim)' : undefined }}
                  onClick={() => selectStudent(s)}
                >
                  <td style={{ padding: '8px 12px' }}>{s.firstname} {s.lastname} {s.nickname ? `(${s.nickname})` : ''}</td>
                  <td style={{ padding: '8px 12px' }}>{s.room}</td>
                  <td style={{ padding: '8px 12px' }}>{s.studentId}</td>
                  <td style={{ padding: '8px 12px' }}>{s.registered ? <span className="badge badge-green">✓</span> : <span className="badge badge-muted">-</span>}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <button className={`badge ${s.checkedIn ? 'badge-green' : 'badge-muted'}`} style={{ cursor: 'pointer', border: 'none' }} onClick={(e) => { e.stopPropagation(); onToggleCheckin(s.id, !!s.checkedIn); }}>
                      {s.checkedIn ? '✓ เช็คอิน' : 'เช็คอิน'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedStudent && (
          <div className="d-card" style={{ alignSelf: 'start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedStudent.firstname} {selectedStudent.lastname}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{selectedStudent.email}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-sm btn-secondary" onClick={() => setEditingStudent((e) => !e)}>
                  <Edit3 className="w-3 h-3" />
                </button>
                <button className="btn btn-sm" style={{ background: 'var(--red-dim)', color: 'var(--red)' }} onClick={() => deleteStudent(selectedStudent.id)}>
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {!editingStudent ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.83rem' }}>
                {([['ห้อง', selectedStudent.room], ['เลขประจำตัว', selectedStudent.studentId], ['ชื่อเล่น', selectedStudent.nickname], ['เบอร์โทร', selectedStudent.phone], ['Line ID', selectedStudent.lineId], ['Instagram', selectedStudent.instagram], ['อาการแพ้', selectedStudent.allergies], ['หมายเหตุสุขภาพ', selectedStudent.healthNote], ['ผู้ติดต่อฉุกเฉิน', selectedStudent.emergencyName], ['เบอร์ฉุกเฉิน', selectedStudent.emergencyPhone]] as [string, string | undefined][]).filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ color: 'var(--text-3)', minWidth: 110 }}>{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <span className={`badge ${selectedStudent.registered ? 'badge-green' : 'badge-muted'}`}>{selectedStudent.registered ? 'ลงทะเบียนแล้ว' : 'ยังไม่ลงทะเบียน'}</span>
                  <span className={`badge ${selectedStudent.checkedIn ? 'badge-green' : 'badge-muted'}`}>{selectedStudent.checkedIn ? 'เช็คอินแล้ว' : 'ยังไม่เช็คอิน'}</span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {([['nickname', 'ชื่อเล่น'], ['phone', 'เบอร์โทร'], ['lineId', 'Line ID'], ['instagram', 'Instagram'], ['allergies', 'อาการแพ้'], ['emergencyName', 'ผู้ติดต่อฉุกเฉิน'], ['emergencyPhone', 'เบอร์ฉุกเฉิน']] as [keyof Student, string][]).map(([key, label]) => (
                  <div key={key} className="form-group">
                    <label className="form-label">{label}</label>
                    <input className="form-input" style={{ fontSize: '0.85rem', padding: '7px 10px' }} value={(editStudentForm[key] as string) ?? ''} onChange={(e) => setEditStudentForm((p) => ({ ...p, [key]: e.target.value }))} />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <button className="btn btn-sm btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditingStudent(false)}>ยกเลิก</button>
                  <button className="btn btn-sm btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={saveEdit}>บันทึก</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
