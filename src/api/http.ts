/**
 * HTTP client của app du khách — bản mobile của DTRPS-Web/src/client/api/http.ts:
 * cùng cách gắn token, tự làm mới access token một lần khi gặp 401, cùng cách đọc lỗi của Backend.
 */
import { API_URL, REQUEST_TIMEOUT_MS } from './config';

export class ClientApiError extends Error {
  readonly status: number;
  /** Lỗi theo từng trường khi dữ liệu gửi lên không hợp lệ (400) */
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, status: number, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'ClientApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/** Phiên đăng nhập do AuthProvider đăng ký vào */
export interface SessionBinding {
  getAccessToken: () => string | null;
  /** Lấy access token mới bằng refresh token; trả false nếu phiên đã hết */
  refresh: () => Promise<boolean>;
  onExpired: () => void;
}

let session: SessionBinding | null = null;

export function bindSession(binding: SessionBinding | null): void {
  session = binding;
}

export function getSessionAccessToken(): string | null {
  return session?.getAccessToken() ?? null;
}

export async function refreshSessionToken(): Promise<boolean> {
  return session ? session.refresh() : false;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Một file ảnh chọn từ máy (expo-image-picker) để gửi multipart */
export interface UploadFile {
  uri: string;
  name: string;
  type: string;
}

export interface RequestOptions {
  method?: Method;
  body?: unknown;
  /** false: không gửi token (đăng nhập, đăng ký, làm mới token, API công khai) */
  auth?: boolean;
  /** Ghi đè thời gian chờ (ms), ví dụ khi tải ảnh lên hay gọi AI */
  timeoutMs?: number;
}

const NETWORK_ERROR = 'Không kết nối được máy chủ, vui lòng kiểm tra mạng và thử lại';
const TIMEOUT_ERROR = 'Máy chủ phản hồi quá lâu, vui lòng thử lại';
const FALLBACK_ERROR = 'Không thể xử lý yêu cầu, vui lòng thử lại';

function parseError(status: number, payload: unknown): ClientApiError {
  if (typeof payload === 'object' && payload !== null) {
    const { message, errors } = payload as { message?: unknown; errors?: unknown };
    const fieldErrors =
      typeof errors === 'object' && errors !== null ? (errors as Record<string, string>) : {};
    if (typeof message === 'string' && message.trim()) {
      return new ClientApiError(message, status, fieldErrors);
    }
  }
  return new ClientApiError(FALLBACK_ERROR, status);
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const { method = 'GET', body, auth = true, timeoutMs = REQUEST_TIMEOUT_MS } = options;
  const isForm = body instanceof FormData;
  const headers: Record<string, string> = { Accept: 'application/json', 'Accept-Language': 'vi' };
  // FormData: để fetch tự đặt multipart boundary
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
  const token = auth ? session?.getAccessToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    throw new ClientApiError(aborted ? TIMEOUT_ERROR : NETWORK_ERROR, 0);
  } finally {
    clearTimeout(timer);
  }
}

export async function clientRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const auth = options.auth ?? true;
  // Chỉ xử lý "hết phiên" khi request có gửi token
  const sentToken = auth && Boolean(session?.getAccessToken());
  let response = await send(path, options);

  // Access token hết hạn: làm mới một lần rồi gửi lại
  if (response.status === 401 && sentToken && session) {
    if (await session.refresh()) {
      response = await send(path, options);
    }
    if (response.status === 401) {
      // Phiên không còn dùng được (bị thu hồi, đổi mật khẩu ở nơi khác…) → đăng xuất
      session.onExpired();
    }
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : undefined;
  } catch {
    payload = text;
  }
  if (!response.ok) throw parseError(response.status, payload);
  return payload as T;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : FALLBACK_ERROR;
}

/** Thêm một ảnh vào FormData theo đúng định dạng React Native cần */
export function appendFile(form: FormData, field: string, file: UploadFile): void {
  form.append(field, { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
}

/** Dựng query string, bỏ qua giá trị rỗng (URLSearchParams của React Native chưa đầy đủ) */
export function buildQuery(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  return Object.entries(params)
    .filter(
      (entry): entry is [string, string | number | boolean] =>
        entry[1] !== undefined && entry[1] !== null && entry[1] !== '',
    )
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
}
