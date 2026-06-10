export type Screen = 'home' | 'ann' | 'schedule' | 'contact';

export interface Announcement { id: string; title: string; createdAt: Date | null; }
