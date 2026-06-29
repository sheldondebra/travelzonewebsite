import {
  deliverEmail,
  formatEmailDeliveryError,
  type SendEmailParams,
} from "@/lib/email-delivery";
import { getAdminNotificationEmails } from "@/lib/email-recipients";
import { getEmailDeliveryConfig, getNotificationSettings } from "@/lib/site-settings";
import {
  getModeLabel,
  getTimeSlotLabel,
  getTopicLabel,
  type ConsultationMode,
  type ConsultationTimeSlot,
  type ConsultationTopic,
} from "@/lib/consultations";
import {
  getCabinClassLabel,
  getTripTypeLabel,
  type CabinClass,
  type TripType,
} from "@/lib/ticket-requests";
import { formatShortDate } from "@/lib/date-utils";
import {
  getContactSubjectLabel,
  type ContactSubject,
} from "@/lib/contact-messages";

export async function sendEmail(params: SendEmailParams) {
  const delivery = await getEmailDeliveryConfig();
  if (!delivery) {
    throw new Error(
      "Email is not configured. Enable Resend or SMTP under Admin → Settings → Email.",
    );
  }

  try {
    await deliverEmail(delivery, params);
  } catch (error) {
    throw new Error(formatEmailDeliveryError(error));
  }
}

export async function sendTestEmail(to: string) {
  await sendEmail({
    to,
    subject: "Travel Zone Ghana — email test",
    text: "This is a test email from your Travel Zone Ghana admin settings. Email delivery is working correctly.",
  });
}

export async function sendContactMessageReplyEmail(params: {
  message: {
    id: string;
    fullName: string;
    email: string;
    subject: ContactSubject;
    message: string;
  };
  reply: string;
}) {
  const { message, reply } = params;
  const subjectLabel = getContactSubjectLabel(message.subject);

  const text = `Hi ${message.fullName},

${reply}

---
Regarding your message (ref ${message.id})
Subject: ${subjectLabel}

Your message:
${message.message}

Travel Zone Ghana
#2 Boundary Road, East Legon, Accra`;

  await sendEmail({
    to: message.email,
    subject: `Re: ${subjectLabel} — Travel Zone Ghana (${message.id})`,
    text,
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
      // Customer email is best-effort when email delivery is configured.
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

export async function sendTicketRequestEmails(request: {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  tripType: TripType;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass: CabinClass;
  flexibleDates: boolean;
  notes?: string;
}) {
  const notifications = await getNotificationSettings();
  const adminRecipients = getAdminNotificationEmails(notifications);
  const trip = getTripTypeLabel(request.tripType);
  const cabin = getCabinClassLabel(request.cabinClass);
  const route = `${request.origin} → ${request.destination}`;
  const dates =
    request.tripType === "round-trip" && request.returnDate
      ? `${formatShortDate(request.departureDate)} – ${formatShortDate(request.returnDate)}`
      : formatShortDate(request.departureDate);

  const customerText = `Hi ${request.fullName},

Thank you for your ticket request with Travel Zone Ghana. Our team will search fares and contact you with options — no payment is taken online.

Reference: ${request.id}
Route: ${route}
Trip: ${trip}
Travel dates: ${dates}
Passengers: ${request.passengers}
Cabin: ${cabin}${request.flexibleDates ? "\nFlexible dates: Yes" : ""}

We typically respond within one business day. For urgent travel, call our office.

Travel Zone Ghana
#2 Boundary Road, East Legon, Accra`;

  if (notifications.emailCustomerOnTicketRequest) {
    try {
      await sendEmail({
        to: request.email,
        subject: `Ticket request received — ${request.id}`,
        text: customerText,
      });
    } catch {
      // Customer email is best-effort when email delivery is configured.
    }
  }

  if (!notifications.emailOnTicketRequest) return;

  await sendEmail({
    to: adminRecipients,
    subject: `New ticket request ${request.id}`,
    text: `New ticket booking request:

Reference: ${request.id}
Customer: ${request.fullName} (${request.email})
Phone: ${request.phone}
Route: ${route}
Trip: ${trip}
Dates: ${dates}
Passengers: ${request.passengers}
Cabin: ${cabin}
Flexible dates: ${request.flexibleDates ? "Yes" : "No"}${request.notes ? `\nNotes: ${request.notes}` : ""}`,
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
      // Customer email is best-effort when email delivery is configured.
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
