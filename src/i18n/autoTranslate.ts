import { API_URL } from '../api/config';

const VN_DIACRITIC_RE =
  /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ]/;

export function hasVietnameseChars(text: string): boolean {
  return VN_DIACRITIC_RE.test(text);
}

const memoryCache = new Map<string, string>();
const inflight = new Set<string>();
const pendingQueue = new Set<string>();
const listeners = new Set<() => void>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function getCachedAutoTranslation(text: string): string | undefined {
  return memoryCache.get(text);
}

export function subscribeAutoTranslations(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(): void {
  listeners.forEach((cb) => cb());
}

async function flushBatch(): Promise<void> {
  flushTimer = null;
  const batch = [...pendingQueue].slice(0, 35);
  if (batch.length === 0) return;
  for (const item of batch) {
    pendingQueue.delete(item);
    inflight.add(item);
  }

  try {
    const res = await fetch(`${API_URL}/translate/vi-en`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: batch }),
    });
    if (res.ok) {
      const data = (await res.json()) as { translations?: Record<string, string> };
      const map = data.translations ?? {};
      let updated = false;
      for (const [src, dst] of Object.entries(map)) {
        if (dst && dst !== src) {
          memoryCache.set(src, dst);
          updated = true;
        } else {
          memoryCache.set(src, src);
        }
      }
      if (updated) notifyListeners();
    }
  } catch {
    // Mạng lỗi → giữ nguyên chữ gốc
  } finally {
    for (const item of batch) inflight.delete(item);
    if (pendingQueue.size > 0 && flushTimer === null) {
      flushTimer = setTimeout(() => void flushBatch(), 120);
    }
  }
}

export function queueAutoTranslation(text: string): void {
  const key = text.replace(/\s+/g, ' ').trim();
  if (!key || key.length < 2 || key.length > 1800) return;
  if (!hasVietnameseChars(key)) return;
  if (memoryCache.has(key) || inflight.has(key) || pendingQueue.has(key)) return;
  pendingQueue.add(key);
  if (flushTimer === null) {
    flushTimer = setTimeout(() => void flushBatch(), 80);
  }
}
