export interface StudentData {
  firstname?: string; lastname?: string; nickname?: string;
  room?: string; studentId?: string;
  phone?: string; lineId?: string; instagram?: string;
  allergies?: string; healthNote?: string;
  emergencyName?: string; emergencyPhone?: string; emergencyRelation?: string;
  photoURL?: string;
  registered?: boolean; checkedIn?: boolean;
  groupId?: string; trioGroupId?: string;
}

export interface MemberInfo {
  uid: string; name: string; nickname?: string; room?: string;
}

export interface TrioGroup {
  id: string;
  leaderId: string;
  members: string[];
  memberInfo: MemberInfo[];
  code: string;
  joinRequests: MemberInfo[];
  createdAt: Date | null;
}

export interface StudentSearchResult {
  uid: string; firstname?: string; lastname?: string; nickname?: string; room?: string;
}

export interface AssignedGroup {
  id: string; name: string; members: string[]; memberInfo?: MemberInfo[];
}

export interface EventInfo {
  name?: string; date?: string; location?: string; description?: string; lineUrl?: string;
}
