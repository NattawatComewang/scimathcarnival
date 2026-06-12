export interface TimelineItem {
  num: string;
  label: string;
  date: string;
  desc: string;
  status: 'active' | 'future';
  tag: string;
}

export interface ActivityItem {
  num: number;
  name: string;
  sub: string;
}
