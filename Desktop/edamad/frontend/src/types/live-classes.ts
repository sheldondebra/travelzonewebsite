export interface LiveLectureMessage {
  id: number;
  live_lecture_id: number;
  sender_name: string;
  sender_initials: string | null;
  message: string;
  sent_at: string;
}

export interface LiveLecture {
  id: number;
  title: string;
  slug: string;
  course_title: string;
  topic: string;
  instructor_name: string;
  instructor_credentials: string | null;
  starts_at: string;
  duration_minutes: number;
  meeting_id: string | null;
  zoom_link: string | null;
  enrolled_count: number;
  attendee_count: number;
  is_live: boolean;
  learning_objectives: string[];
  slides_url: string | null;
  messages?: LiveLectureMessage[];
}

export interface LiveLectureResponse {
  lecture: LiveLecture;
  upcoming: LiveLecture[];
}
