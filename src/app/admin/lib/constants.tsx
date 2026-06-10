import {
  LayoutDashboard, Users, Layers, ClipboardCheck, Settings,
  UserCog, Bell, CalendarCog, Shield, FileDown, ScrollText,
} from 'lucide-react';
import type { AdminSection } from './types';

export const NAV_ITEMS: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',       label: 'Overview',            icon: <LayoutDashboard style={{ width: 14, height: 14 }} /> },
  { id: 'students',       label: 'ข้อมูลนักเรียน',      icon: <Users style={{ width: 14, height: 14 }} /> },
  { id: 'groups',         label: 'กลุ่ม/ทีม',            icon: <Layers style={{ width: 14, height: 14 }} /> },
  { id: 'checkin',        label: 'Check-in',             icon: <ClipboardCheck style={{ width: 14, height: 14 }} /> },
  { id: 'registration',   label: 'ตั้งค่าการลงทะเบียน', icon: <Settings style={{ width: 14, height: 14 }} /> },
  { id: 'committee',      label: 'บุคลากร',              icon: <UserCog style={{ width: 14, height: 14 }} /> },
  { id: 'announcements',  label: 'ประกาศ',               icon: <Bell style={{ width: 14, height: 14 }} /> },
  { id: 'event-settings', label: 'ตั้งค่างาน',           icon: <CalendarCog style={{ width: 14, height: 14 }} /> },
  { id: 'staff-accounts', label: 'บัญชีพี่',             icon: <Shield style={{ width: 14, height: 14 }} /> },
  { id: 'export',         label: 'Export',               icon: <FileDown style={{ width: 14, height: 14 }} /> },
  { id: 'logs',           label: 'Audit Logs',           icon: <ScrollText style={{ width: 14, height: 14 }} /> },
];
