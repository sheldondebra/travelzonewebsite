import type { ContentStatus } from "@/lib/content-types";

export type AboutTeamMember = {
  name: string;
  role: string;
  bio: string;
  image: string;
};

export type AdminAboutTeamMember = AboutTeamMember & {
  id: string;
  sortOrder: number;
  status: ContentStatus;
  updatedAt: string;
};

export type AboutTeamMemberInput = AboutTeamMember & {
  sortOrder: number;
  status: ContentStatus;
};
