import nodemailer from "nodemailer";
import { getAdminNotificationEmails } from "@/lib/email-recipients";
import { getSmtpConfig, getNotificationSettings } from "@/lib/site-settings";
import {
  getModeLabel,
  getTimeSlotLabel,
  getTopicLabel,
  type ConsultationMode,
  type ConsultationTimeSlot,
  type ConsultationTopic,
} from "@/lib/consultations";
import {
  getContactSubjectLabel,
  type ContactSubject,
} from "@/lib/contact-messages";

type SendEmailParams = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail({ to, subject, text, html }: SendEmailParams) {
  const smtp = await getSmtpConfig();
  if (!smtp) {
    throw new Error("SMTP is not configured or disabled.");
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth:
      smtp.user && smtp.password
        ? { user: smtp.user, pass: smtp.password }
        : undefined,
  });

  await transporter.sendMail({
    from: `"${smtp.fromName}" <${smtp.fromEmail}>`,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    text,
    html: html ?? text.replace(/\n/g, "<br>"),
  });
}

export async function sendTestEmail(to: string) {
  await sendEmail({
    to,
    subject: "Travel Zone Ghana — SMTP test",
    text: "This is a test email from your Travel Zone Ghana admin settings. SMTP is working correctly.",
  });
}

export async function sendBookingPaidEmails(booking: {
  id: string;
  fullName: string;
  email: string;
  tourTitle: string;
  travelDate: string;
  travelers: number;
  paidAmountGhs: number;
}) {
  const { getNotificationSettings } = await import("@/lib/site-settings");
  const notifications = await getNotificationSettings();

  if (!notifications.emailOnBookingPaid) return;

  const customerText = `Hi ${booking.fullName},

Thank you for your payment of GHS ${booking.paidAmountGhs.toLocaleString()} for ${booking.tourTitle}.

Booking reference: ${booking.id}
Travel date: ${booking.travelDate}
Travelers: ${booking.travelers}

We will confirm your trip details shortly.

Travel Zone Ghana`;

  if (notifications.emailCustomerOnBookingPaid && booking.email) {
    await sendEmail({
      to: booking.email,
      subject: `Payment received — ${booking.tourTitle}`,
      text: customerText,
    });
  }

  const adminRecipients = notifications.emailOnBookingPaidTo
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (adminRecipients.length > 0) {
    await sendEmail({
      to: adminRecipients,
      subject: `New paid booking ${booking.id}`,
      text: `New paid booking:

Reference: ${booking.id}
Customer: ${booking.fullName} (${booking.email})
Tour: ${booking.tourTitle}
Amount: GHS ${booking.paidAmountGhs.toLocaleString()}
Travel date: ${booking.travelDate}
Travelers: ${booking.travelers}`,
    });
  }
}

export async function sendConsultationBookingEmails(booking: {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: ConsultationTimeSlot;
  topic: ConsultationTopic;
  mode: ConsultationMode;
  notes?: string;
}) {
  const notifications = await getNotificationSettings();
  const adminRecipients = getAdminNotificationEmails(notifications);

  const topic = getTopicLabel(booking.topic);
  const mode = getModeLabel(booking.mode);
  const time = getTimeSlotLabel(booking.preferredTime);

  const customerText = `Hi ${booking.fullName},

Thank you for booking a consultation with Travel Zone Ghana.

Reference: ${booking.id}
Date: ${booking.preferredDate}
Time: ${time}
Topic: ${topic}
Meeting: ${mode}

Our team will confirm your appointment shortly. If you need to reschedule, reply to this email or call our office.

Travel Zone Ghana
#2 Boundary Road, East Legon, Accra`;

  if (notifications.emailCustomerOnConsultationRequest) {
    try {
      await sendEmail({
        to: booking.email,
        subject: `Consultation request received — ${booking.id}`,
        text: customerText,
      });
    } catch {
      // Customer email is best-effort when SMTP is configured.
    }
  }

  if (!notifications.emailOnConsultationRequest) return;

  await sendEmail({
    to: adminRecipients,
    subject: `New consultation request ${booking.id}`,
    text: `New consultation booking:

Reference: ${booking.id}
Customer: ${booking.fullName} (${booking.email})
Phone: ${booking.phone}
Date: ${booking.preferredDate}
Time: ${time}
Topic: ${topic}
Meeting: ${mode}${booking.notes ? `\nNotes: ${booking.notes}` : ""}`,
  });
}

export async function sendContactMessageEmails(message: {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  subject: ContactSubject;
  message: string;
}) {
  const notifications = await getNotificationSettings();
  const adminRecipients = getAdminNotificationEmails(notifications);
  const subjectLabel = getContactSubjectLabel(message.subject);

  const customerText = `Hi ${message.fullName},

Thank you for contacting Travel Zone Ghana. We received your message and will reply within one business day.

Reference: ${message.id}
Subject: ${subjectLabel}

Your message:
${message.message}

Travel Zone Ghana
#2 Boundary Road, East Legon, Accra`;

  if (notifications.emailCustomerOnContactMessage) {
    try {
      await sendEmail({
        to: message.email,
        subject: `We received your message — ${message.id}`,
        text: customerText,
      });
    } catch {
      // Customer email is best-effort when SMTP is configured.
    }
  }

  if (!notifications.emailOnContactMessage) return;

  await sendEmail({
    to: adminRecipients,
    subject: `New contact message ${message.id}`,
    text: `New contact form submission:

Reference: ${message.id}
Name: ${message.fullName}
Email: ${message.email}
Phone: ${message.phone}
Subject: ${subjectLabel}

Message:
${message.message}`,
  });
}

export async function sendNewsletterSignupEmail(email: string) {
  const { getNotificationSettings } = await import("@/lib/site-settings");
  const notifications = await getNotificationSettings();

  if (!notifications.emailOnNewsletterSignup) return;

  const recipients = notifications.emailOnNewsletterSignupTo
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (recipients.length === 0) return;

  await sendEmail({
    to: recipients,
    subject: "New newsletter subscriber",
    text: `A new visitor subscribed to the newsletter: ${email}`,
  });
}
