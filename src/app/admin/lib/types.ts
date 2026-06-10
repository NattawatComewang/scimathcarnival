export type AdminSection =
  | 'overview' | 'students' | 'groups' | 'checkin'
  | 'registration' | 'committee' | 'announcements'
  | 'event-settings' | 'staff-accounts' | 'export' | 'logs';

export interface Student {
  id: string;
  firstname?: string; lastname?: string; nickname?: string;
  room?: string; studentId?: string; email?: string;
  phone?: string; lineId?: string; instagram?: string;
  allergies?: string; healthNote?: string;
  emergencyName?: string; emergencyPhone?: string; emergencyRelation?: string;
  registered?: boolean; checkedIn?: boolean; groupId?: string;
}

export interface LogEntry {
  id: string; action: string; detail: string; by: string; at: Date | null;
}

export interface Group {
  id: string; name: string; members: string[]; color?: string;
}

export interface CommitteeMember {
  id: string;
  firstName?: string; lastName?: string; nickname?: string;
  department?: string; position?: string; room?: string;
  email?: string; instagram?: string; bio?: string;
  photoURL?: string; photos?: string[]; order?: number;
}

export interface RegSettings {
  isOpen: boolean; startDate: string; endDate: string; eligibleRooms: string;
}

export interface EventSettings {
  name: string; date: string; location: string; description: string; lineUrl?: string;
}

export interface StaffAccount {
  id: string; email: string; name: string; role: string; active: boolean;
}
