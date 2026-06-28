export type ContactSubject = "tour" | "corporate" | "group" | "ticketing" | "other";

export type ContactMessageStatus = "pending" | "read" | "archived";

export type ContactMessage = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  subject: ContactSubject;
  message: string;
  status: ContactMessageStatus;
  createdAt: string;
};

export type ContactMessageInput = {
  name: string;
  email: string;
  phone: string;
  subject: ContactSubject;
  message: string;
};

export type ContactMessageResult =
  | { success: true; messageId: string }
  | { success: false; error: string };

export const contactSubjects: { value: ContactSubject; label: string }[] = [
  { value: "tour", label: "Tour Package Inquiry" },
  { value: "corporate", label: "Corporate Travel" },
  { value: "group", label: "Group Travel" },
  { value: "ticketing", label: "Airline Ticketing" },
  { value: "other", label: "Other" },
];

export function getContactSubjectLabel(subject: ContactSubject) {
  return contactSubjects.find((item) => item.value === subject)?.label ?? subject;
}

export function isContactSubject(value: string): value is ContactSubject {
  return contactSubjects.some((item) => item.value === value);
}
