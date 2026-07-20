import axios from "axios";

type ApiErrorBody = {
  message?: string;
  errors?: Record<string, string[]>;
};

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError<ApiErrorBody>(error)) {
    return fallback;
  }

  const status = error.response?.status;
  const data = error.response?.data;

  if (status === 419) {
    return "Your session expired. Refresh the page and try again.";
  }

  if (data?.errors?.email?.[0]) {
    return data.errors.email[0];
  }

  if (data?.message && data.message !== "CSRF token mismatch.") {
    return data.message;
  }

  return fallback;
}

export function getUploadErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError<ApiErrorBody>(error)) {
    return error instanceof Error && error.message ? error.message : fallback;
  }

  const fieldErrors = error.response?.data?.errors;
  if (fieldErrors) {
    for (const key of ["video", "file", "type"]) {
      const message = fieldErrors[key]?.[0];
      if (message) return message;
    }
    const firstKey = Object.keys(fieldErrors)[0];
    if (firstKey && fieldErrors[firstKey]?.[0]) {
      return fieldErrors[firstKey][0];
    }
  }

  return getApiErrorMessage(error, fallback);
}
