import { NativeModules, Platform } from 'react-native';
import type { GoongRouteStep } from '../api/tripFlowApi';

interface VoiceGuidanceNative {
  speak?: (text: string) => void;
  stop?: () => void;
}

const voiceModule = NativeModules.VoiceGuidance as VoiceGuidanceNative | undefined;

/** Đọc câu hướng dẫn tiếng Việt (Android dùng TextToSpeech native, an toàn trên iOS/Web) */
export function speakNavigation(text: string): void {
  if (!text.trim()) return;
  if (Platform.OS === 'android') {
    try {
      voiceModule?.speak?.(text);
    } catch {
      // Bỏ qua nếu bản build chưa có VoiceGuidanceModule
    }
  }
}

/** Dừng ngay giọng đọc hiện tại */
export function stopNavigationSpeech(): void {
  if (Platform.OS === 'android') {
    try {
      voiceModule?.stop?.();
    } catch {
      // Bỏ qua
    }
  }
}

/** Tạo câu đọc tự nhiên từ bước rẽ Goong (vd. "Trong 200 mét, rẽ phải vào Trần Quang Khải") */
export function buildStepSpeech(step: GoongRouteStep): string {
  const instruction = step.instruction.trim();
  if (!instruction) return '';
  if (step.distanceMeters >= 1000) {
    const km = (step.distanceMeters / 1000).toFixed(1).replace('.', ' phẩy ');
    return `Trong ${km} ki lô mét, ${instruction}`;
  }
  if (step.distanceMeters >= 30) {
    const rounded = Math.round(step.distanceMeters / 10) * 10;
    return `Trong ${rounded} mét, ${instruction}`;
  }
  return instruction;
}
