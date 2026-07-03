const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const TOKEN_STORAGE_KEY = "atg_access_token";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers = new Headers(options.headers);
  if (!isFormData && options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: isFormData ? (options.body as FormData) : options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "message" in payload
        ? Array.isArray((payload as { message: unknown }).message)
          ? (payload as { message: string[] }).message.join(", ")
          : String((payload as { message: unknown }).message)
        : `Ошибка запроса (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

/** Скачивает вложение отчёта с авторизацией и запускает сохранение файла в браузере. */
export async function downloadAttachment(reportId: string, attachmentId: string, fileName: string) {
  const token = getToken();
  const response = await fetch(`${API_URL}/reports/${reportId}/attachments/${attachmentId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) {
    throw new ApiError("Не удалось скачать файл", response.status);
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
