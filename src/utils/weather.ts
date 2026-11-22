import type { IconName } from '../ui/Icon';

/**
 * Mã thời tiết WMO (Open-Meteo) → icon Material. Khớp với weatherIcons.ts của web và nhãn tiếng
 * Việt của WeatherCodeMapper bên Backend.
 */
export function weatherIconName(code: number | null | undefined): IconName {
  if (code === null || code === undefined) return 'help-outline';
  if (code === 0) return 'wb-sunny';
  if (code >= 1 && code <= 3) return 'cloud';
  if (code === 45 || code === 48) return 'foggy';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'umbrella';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'ac-unit';
  if (code === 95 || code === 96 || code === 99) return 'thunderstorm';
  return 'help-outline';
}

/** Mã giông bão (95/96/99) tô màu cảnh báo đậm hơn mưa thường */
export function isStormCode(code: number | null | undefined): boolean {
  return code === 95 || code === 96 || code === 99;
}

const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** "yyyy-MM-dd" → "T2"/"T3".../"CN" */
export function weekdayShortLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return Number.isNaN(date.getTime()) ? '' : WEEKDAY_SHORT[date.getDay()];
}

export const formatTemp = (value: number | null) => (value === null ? '--' : `${Math.round(value)}°`);
