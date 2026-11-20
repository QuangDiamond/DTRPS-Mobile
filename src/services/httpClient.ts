import { API_BASE_URL, DEFAULT_TIMEOUT_MS } from './config';
import { getAccessToken } from './authToken';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  timeoutMs?: number;
  /** false: không gắn Bearer token (dùng cho endpoint công khai hoặc /auth/login, /auth/register). */
  auth?: boolean;
};

/**
 * Gọi REST API thật của DTRPS-Backend. Mirror của clientRequest bên DTRPS-Web
 * (src/client/api/http.ts): cùng base URL gốc /api, cùng cách đọc lỗi từ ErrorResponse.message.
 */
export async function clientRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, timeoutMs = DEFAULT_TIMEOUT_MS, auth = true } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (caught) {
    clearTimeout(timer);
    if (caught instanceof Error && caught.name === 'AbortError') {
      throw new ApiError(0, 'Hết thời gian chờ phản hồi từ máy chủ, vui lòng thử lại.');
    }
    throw new ApiError(0, 'Không thể kết nối tới máy chủ. Kiểm tra kết nối mạng.');
  }
  clearTimeout(timer);

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      (data && typeof data.message === 'string' && data.message) ||
      'Hệ thống đang gặp sự cố, vui lòng thử lại sau';
    throw new ApiError(response.status, message);
  }

  return data as T;
}

export function errorMessage(caught: unknown): string {
  if (caught instanceof ApiError) return caught.message;
  if (caught instanceof Error) return caught.message;
  return 'Đã có lỗi xảy ra, vui lòng thử lại.';
}
