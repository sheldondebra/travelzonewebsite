"use client";

import { useState } from "react";
import { submitContactMessage } from "@/app/actions/contact";
import type { ContactSubject } from "@/lib/contact-messages";

type FormState = "idle" | "submitting" | "success";

type FormFields = {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormFields, string>>;

const initialFields: FormFields = {
  name: "",
  phone: "",
  email: "",
  subject: "",
  message: "",
};

function validateContactForm(fields: FormFields): FormErrors {
  const errors: FormErrors = {};

  const name = fields.name.trim();
  if (!name) {
    errors.name = "Full name is required.";
  } else if (name.length < 2) {
    errors.name = "Please enter your full name.";
  }

  const phone = fields.phone.trim();
  if (!phone) {
    errors.phone = "Phone number is required.";
  } else if (!/^(\+233|0)[2-9]\d{8}$/.test(phone.replace(/[\s-]/g, ""))) {
    errors.phone = "Enter a valid Ghana phone number (e.g. 0244 274 663).";
  }

  const email = fields.email.trim();
  if (!email) {
    errors.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!fields.subject) {
    errors.subject = "Please select a topic.";
  }

  const message = fields.message.trim();
  if (!message) {
    errors.message = "Message is required.";
  } else if (message.length < 10) {
    errors.message = "Message should be at least 10 characters.";
  }

  return errors;
}

function fieldClass(hasError: boolean) {
  return `w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${
    hasError
      ? "border-brand-red focus:border-brand-red"
      : "border-gray-200 focus:border-brand-red"
  }`;
}

export function ContactForm() {
  const [state, setState] = useState<FormState>("idle");
  const [fields, setFields] = useState<FormFields>(initialFields);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [messageId, setMessageId] = useState<string | null>(null);

  function updateField<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError("");

    const validationErrors = validateContactForm(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setState("submitting");

    try {
      const result = await submitContactMessage({
        name: fields.name.trim(),
        email: fields.email.trim(),
        phone: fields.phone.trim(),
        subject: fields.subject as ContactSubject,
        message: fields.message.trim(),
      });

      if (!result.success) {
        setSubmitError(result.error);
        setState("idle");
        return;
      }

      setMessageId(result.messageId);
      setState("success");
      setFields(initialFields);
    } catch {
      setSubmitError("Something went wrong. Please try again or call us.");
      setState("idle");
    }
  }

  if (state === "success") {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-green/10">
          <span className="text-2xl text-accent-green">✓</span>
        </div>
        <h3 className="heading-serif text-2xl text-navy">Message Sent</h3>
        <p className="mt-3 text-[15px] text-text-muted">
          Thank you for reaching out. Our team will get back to you within one
          business day.
          {messageId ? (
            <>
              {" "}
              Your reference is <strong className="text-navy">{messageId}</strong>.
            </>
          ) : null}
        </p>
        <button
          type="button"
          onClick={() => {
            setState("idle");
            setMessageId(null);
          }}
          className="mt-6 text-sm font-semibold text-brand-red hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl bg-white p-8 shadow-sm lg:p-10"
    >
      <h2 className="heading-serif text-2xl text-brand-red">Send Us a Message</h2>
      <p className="mt-2 text-sm text-text-muted">
        Fill out the form and we&apos;ll respond as soon as possible.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-navy">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={fields.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Your name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={fieldClass(Boolean(errors.name))}
          />
          {errors.name && (
            <p id="name-error" className="mt-1.5 text-xs text-brand-red">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-navy">
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={fields.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="0244 XXX XXXX"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            className={fieldClass(Boolean(errors.phone))}
          />
          {errors.phone && (
            <p id="phone-error" className="mt-1.5 text-xs text-brand-red">
              {errors.phone}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-navy">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={fields.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={fieldClass(Boolean(errors.email))}
          />
          {errors.email && (
            <p id="email-error" className="mt-1.5 text-xs text-brand-red">
              {errors.email}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-navy">
            Subject
          </label>
          <select
            id="subject"
            name="subject"
            value={fields.subject}
            onChange={(e) => updateField("subject", e.target.value)}
            aria-invalid={Boolean(errors.subject)}
            aria-describedby={errors.subject ? "subject-error" : undefined}
            className={fieldClass(Boolean(errors.subject))}
          >
            <option value="">Select a topic</option>
            <option value="tour">Tour Package Inquiry</option>
            <option value="corporate">Corporate Travel</option>
            <option value="group">Group Travel</option>
            <option value="ticketing">Airline Ticketing</option>
            <option value="other">Other</option>
          </select>
          {errors.subject && (
            <p id="subject-error" className="mt-1.5 text-xs text-brand-red">
              {errors.subject}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-navy">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            value={fields.message}
            onChange={(e) => updateField("message", e.target.value)}
            placeholder="Tell us about your travel plans..."
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? "message-error" : undefined}
            className={`${fieldClass(Boolean(errors.message))} resize-none`}
          />
          {errors.message && (
            <p id="message-error" className="mt-1.5 text-xs text-brand-red">
              {errors.message}
            </p>
          )}
        </div>
      </div>

      {submitError ? (
        <p className="mt-5 rounded-xl bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
          {submitError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="btn-primary mt-8 w-full sm:w-auto disabled:opacity-60"
      >
        {state === "submitting" ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
