export function getBackendUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "/api";

  if (apiUrl.startsWith("http")) {
    return apiUrl.replace(/\/api\/?$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return process.env.BACKEND_URL ?? "http://localhost:8000";
}

export function getSanctumCsrfUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "/api";

  if (apiUrl.startsWith("http")) {
    return `${getBackendUrl()}/sanctum/csrf-cookie`;
  }

  return "/sanctum/csrf-cookie";
}

function readCsrfToken() {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("XSRF-TOKEN="));

  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

export { readCsrfToken };
