type IconProps = {
  className?: string;
};

export function DashboardIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M3 3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3Zm9 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V3ZM3 12a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4Zm9 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4Z" />
    </svg>
  );
}

export function ToursIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 2a5 5 0 0 0-5 5c0 3.75 5 9 5 9s5-5.25 5-9a5 5 0 0 0-5-5Zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
    </svg>
  );
}

export function PostsIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Zm-1 2v2H7V4h6Zm0 4v2H7V8h6Zm-2 4v2H7v-2h4Z" />
    </svg>
  );
}

export function BookingsIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M6 2a1 1 0 0 0-1 1v1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1V3a1 1 0 1 0-2 0v1H7V3a1 1 0 0 0-1-1Zm10 7H4v7h12V9Z" />
    </svg>
  );
}

export function ConsultationsIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 2a4 4 0 0 0-4 4v1H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1V6a4 4 0 0 0-4-4Zm0 2a2 2 0 0 1 2 2v1H8V6a2 2 0 0 1 2-2Zm-3 7a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2H7Z" />
    </svg>
  );
}

export function ContactMessagesIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M2 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6l-3 3V4Zm3.5 2a1 1 0 1 0 0 2h9a1 1 0 1 0 0-2h-9Zm0 3a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-6Z" />
    </svg>
  );
}

export function NewsletterIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M2 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5Zm2-.5 6.4 4.8a1 1 0 0 0 1.2 0L18 4.5H4Zm14 1.3-5.8 4.3a2.5 2.5 0 0 1-3 0L4 5.8V15h12V5.8Z" />
    </svg>
  );
}

export function SettingsIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M17.4 11.2a1 1 0 0 0 .2-1.1l-.8-1.4a1 1 0 0 0-.9-.5h-.2a5.5 5.5 0 0 0-.5-1l.1-.2a1 1 0 0 0-.3-1.1l-1.2-1.2a1 1 0 0 0-1.1-.3l-.2.1a5.5 5.5 0 0 0-1-.5v-.2a1 1 0 0 0-.5-.9l-1.4-.8a1 1 0 0 0-1.1.2l-.1.1a5.5 5.5 0 0 0-1.2-.2V2.6a1 1 0 0 0-.8-.8h-1.6a1 1 0 0 0-.8.8v.2a5.5 5.5 0 0 0-1.2.2l-.1-.1a1 1 0 0 0-1.1-.2l-1.4.8a1 1 0 0 0-.5.9v.2a5.5 5.5 0 0 0-.5 1l-.2-.1a1 1 0 0 0-1.1.3L2.3 6.9a1 1 0 0 0-.3 1.1l.1.2a5.5 5.5 0 0 0-.5 1h-.2a1 1 0 0 0-.9.5l-.8 1.4a1 1 0 0 0 .2 1.1l.1.1a5.5 5.5 0 0 0 .2 1.2H.8a1 1 0 0 0-.8.8v1.6a1 1 0 0 0 .8.8h.2a5.5 5.5 0 0 0 .5 1l-.1.2a1 1 0 0 0 .3 1.1l1.2 1.2a1 1 0 0 0 1.1.3l.2-.1a5.5 5.5 0 0 0 1 .5v.2a1 1 0 0 0 .5.9l1.4.8a1 1 0 0 0 1.1-.2l.1-.1a5.5 5.5 0 0 0 1.2.2v.2a1 1 0 0 0 .8.8h1.6a1 1 0 0 0 .8-.8v-.2a5.5 5.5 0 0 0 1.2-.2l.1.1a1 1 0 0 0 1.1.2l1.4-.8a1 1 0 0 0 .5-.9v-.2a5.5 5.5 0 0 0 .5-1l.2.1a1 1 0 0 0 1.1-.3l1.2-1.2a1 1 0 0 0 .3-1.1l-.1-.2a5.5 5.5 0 0 0 .5-1h.2a1 1 0 0 0 .9-.5l.8-1.4Z" />
    </svg>
  );
}

export function UsersIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-5.5 7a4.5 4.5 0 0 1 9 0H4.5Zm8.2-6.3a4 4 0 0 1 2.8 3.8H20a5 5 0 0 0-7.3-3.8Z" />
    </svg>
  );
}
