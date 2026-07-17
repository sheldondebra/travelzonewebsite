export type StaffRole = "admin" | "editor";

export type StaffSession = {
  sub: string;
  email: string;
  role: StaffRole;
};

export type StaffUser = {
  user: { id: string; email: string };
  role: StaffRole;
};
