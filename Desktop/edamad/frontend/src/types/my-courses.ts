export interface MyCourse {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  icon: string;
  icon_bg: string;
  lessons_count: number;
  progress_percent: number;
}
