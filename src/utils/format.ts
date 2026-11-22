/** Định dạng dùng chung — cùng quy ước hiển thị với web */

const DAY_MS = 86_400_000;

export const formatNumber = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

/** 150000 → "150.000 đ"; null → fallback */
export function formatMoney(
  value: number | null | undefined,
  currency = 'VND',
  fallback = 'Chưa có giá',
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return fallback;
  if (currency === 'VND') return `${formatNumber(Math.round(value))} đ`;
  return `${formatNumber(value)} ${currency}`;
}

/** Hôm nay theo giờ máy, dạng yyyy-MM-dd */
export function todayIso(): string {
  return toIsoDate(new Date());
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

/** Số ngày từ `from` tới `to` (yyyy-MM-dd) */
export function dayDiff(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to.slice(0, 10)}T00:00:00Z`) - Date.parse(`${from.slice(0, 10)}T00:00:00Z`)) /
      DAY_MS,
  );
}

/** Số ngày của chuyến (tính cả ngày đầu và cuối) */
export const countDays = (start: string, end: string) => Math.max(0, dayDiff(start, end) + 1);

/** "2026-11-27" → "27/11/2026" */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** "2026-11-27" → "T6, 27/11" */
export function formatShortDate(iso: string): string {
  const date = parseIsoDate(iso);
  return `${WEEKDAYS[date.getDay()]}, ${String(date.getDate()).padStart(2, '0')}/${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}`;
}

/** ISO datetime → "27/11/2026 14:05" */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/** "08:30:00" → "08:30" */
export const formatTime = (time: string | null | undefined) => (time ? time.slice(0, 5) : '--:--');

export const PRICE_TYPE_LABEL: Record<string, string> = {
  TICKET: 'Vé vào cửa',
  ROOM_NIGHT: 'Giá phòng / đêm',
  AVG_MEAL: 'Bữa ăn trung bình',
  AVG_DRINK: 'Đồ uống trung bình',
  OTHER: 'Khác',
};

export const WEEKDAY_LABEL = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

/** So sánh không dấu, không phân biệt hoa thường */
export function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}
