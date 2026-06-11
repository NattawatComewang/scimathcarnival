export interface Announcement {
  id: string; title: string; body?: string; createdAt: Date | null; pinned?: boolean;
}
