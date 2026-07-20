/** Build Zoom web client URL from meeting ID or join link. */
export function getZoomEmbedUrl(
  zoomLink: string | null | undefined,
  meetingId: string | null | undefined,
): string | null {
  const fromMeetingId = (meetingId ?? "").replace(/\D/g, "");
  if (fromMeetingId.length >= 9) {
    return `https://zoom.us/wc/${fromMeetingId}/join`;
  }

  const fromLink = zoomLink?.match(/\/j\/(\d+)/)?.[1];
  if (fromLink) {
    return `https://zoom.us/wc/${fromLink}/join`;
  }

  return null;
}

export function instructorDisplayName(name: string, credentials?: string | null): string {
  if (!credentials) return name;
  return `${name}, ${credentials}`;
}
