export type UserRole = "student" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  email_verified_at?: string | null;
  created_at?: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
  message?: string;
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  icon: string;
  icon_bg: string;
  price: string;
  is_published: boolean;
  lessons_count?: number;
  lessons?: Lesson[];
}

export interface Lesson {
  id: number;
  course_id: number;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_seconds: number;
  sort_order: number;
}
