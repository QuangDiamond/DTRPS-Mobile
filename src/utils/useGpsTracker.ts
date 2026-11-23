import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import {
  bearingBetween,
  distanceBetween,
  isLikelyInVietnam,
  type Coordinate,
} from './navGeo';

/**
 * Theo dõi GPS của điện thoại và lọc bớt vị trí xấu trước khi dùng để dẫn đường
 * (bản mobile của useGpsTracker trên web):
 *  - bỏ vị trí sai số quá lớn (trừ khi chờ mãi không có vị trí tốt hơn),
 *  - bỏ vị trí "nhảy" xa bất thường,
 *  - không dùng vị trí ngoài Việt Nam (giả lập Android hay đặt ở Mỹ), báo `suspicious`,
 *  - giữ vị trí ổn định khi đứng yên và tính hướng đi từ chuyển động.
 */

export interface GpsFix {
  coordinate: Coordinate;
  /** Sai số (mét). */
  accuracy: number;
  /** Hướng đi (độ từ hướng Bắc) hoặc null khi chưa biết. */
  heading: number | null;
  /** Tốc độ (m/s) hoặc null. */
  speed: number | null;
  timestamp: number;
  lowAccuracy: boolean;
  /** Vị trí do người dùng chọn tay trên bản đồ. */
  manual: boolean;
}

export interface GpsTracker {
  fix: GpsFix | null;
  message: string;
  /** GPS báo vị trí ngoài Việt Nam: không dùng, chờ người dùng chọn tay hoặc thử lại. */
  suspicious: boolean;
  rejected: Coordinate | null;
  manual: boolean;
  retry: () => void;
  setManual: (coordinate: Coordinate) => void;
  clearManual: () => void;
}

const MAX_ACCURACY_METERS = 500;
const POOR_FIX_FALLBACK_MS = 15_000;
const LOW_ACCURACY_METERS = 200;
const JUMP_DISTANCE_METERS = 500;
const JUMP_SPEED_MPS = 60;
const JUMP_CONFIRMATIONS = 3;
const JITTER_METERS = 15;
const MIN_MOVE_FOR_HEADING_METERS = 8;

interface Sample {
  coordinate: Coordinate;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

const validNumber = (value: number | null | undefined): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;

export function useGpsTracker(enabled: boolean): GpsTracker {
  const [rawFix, setRawFix] = useState<GpsFix | null>(null);
  const [manualFix, setManualFix] = useState<GpsFix | null>(null);
  const [message, setMessage] = useState('Chưa bật định vị');
  const [rejected, setRejected] = useState<Coordinate | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

    let last: GpsFix | null = null;
    let bestPoor: Sample | null = null;
    let jumpCandidates: Sample[] = [];

    setMessage('Đang lấy GPS hiện tại...');
    setRawFix(null);
    setRejected(null);

    const publish = (fix: GpsFix) => {
      last = fix;
      setRawFix(fix);
      setRejected(null);
      setMessage(
        fix.lowAccuracy
          ? `GPS chưa chính xác · sai số khoảng ${Math.round(fix.accuracy)} m`
          : `GPS đã bật · sai số khoảng ${Math.round(fix.accuracy)} m`,
      );
    };

    const accept = (sample: Sample) => {
      let coordinate = sample.coordinate;
      let heading = sample.heading;

      if (last) {
        const moved = distanceBetween(last.coordinate, coordinate);
        const still = sample.speed === null || sample.speed < 1;

        if (moved < Math.min(sample.accuracy, JITTER_METERS) && still) {
          coordinate = last.coordinate;
          heading = last.heading;
        } else if (heading === null && moved >= MIN_MOVE_FOR_HEADING_METERS) {
          heading = bearingBetween(last.coordinate, coordinate);
        } else if (heading === null) {
          heading = last.heading;
        }
      }

      publish({
        coordinate,
        accuracy: sample.accuracy,
        heading,
        speed: sample.speed,
        timestamp: sample.timestamp,
        lowAccuracy: sample.accuracy > LOW_ACCURACY_METERS,
        manual: false,
      });
    };

    const onPosition = (position: Location.LocationObject) => {
      if (cancelled) return;
      const { latitude, longitude, accuracy, heading, speed } = position.coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

      const sample: Sample = {
        coordinate: [latitude, longitude],
        accuracy: typeof accuracy === 'number' && Number.isFinite(accuracy) ? accuracy : 10_000,
        heading: validNumber(heading),
        speed: validNumber(speed),
        timestamp: position.timestamp || Date.now(),
      };

      // 1. Ngoài Việt Nam: không tin, không dùng.
      if (!isLikelyInVietnam(sample.coordinate)) {
        setRejected(sample.coordinate);
        setRawFix(null);
        last = null;
        setMessage('GPS báo vị trí ngoài Việt Nam nên có vẻ không đúng (giả lập vị trí hoặc VPN?).');
        return;
      }

      // 2. Sai số quá lớn: đợi vị trí tốt hơn.
      if (sample.accuracy > MAX_ACCURACY_METERS) {
        if (last) return;
        if (!bestPoor || sample.accuracy < bestPoor.accuracy) bestPoor = sample;
        setMessage(
          `GPS chưa chính xác (sai số khoảng ${Math.round(sample.accuracy)} m), đang chờ tín hiệu tốt hơn...`,
        );
        if (fallbackTimer === undefined) {
          fallbackTimer = setTimeout(() => {
            if (!cancelled && !last && bestPoor) accept(bestPoor);
          }, POOR_FIX_FALLBACK_MS);
        }
        return;
      }

      // 3. Nhảy xa bất thường so với vị trí trước đó.
      if (last) {
        const distance = distanceBetween(last.coordinate, sample.coordinate);
        const seconds = Math.max(1, (sample.timestamp - last.timestamp) / 1000);

        if (distance > JUMP_DISTANCE_METERS && distance / seconds > JUMP_SPEED_MPS) {
          jumpCandidates = [...jumpCandidates, sample].filter(
            (candidate) => distanceBetween(candidate.coordinate, sample.coordinate) < 200,
          );
          if (jumpCandidates.length < JUMP_CONFIRMATIONS) {
            setMessage('Bỏ qua vị trí GPS nhảy bất thường, đang chờ xác nhận...');
            return;
          }
        }
        jumpCandidates = [];
      }

      accept(sample);
    };

    (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (!permission.granted) {
        setMessage('Bạn chưa cấp quyền vị trí. Hãy bật định vị cho ứng dụng trong Cài đặt.');
        return;
      }
      const watcher = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 5, timeInterval: 2000 },
        onPosition,
      );
      if (cancelled) watcher.remove();
      else subscription = watcher;
    })().catch(() => {
      if (!cancelled) setMessage('Thiết bị chưa xác định được vị trí GPS.');
    });

    return () => {
      cancelled = true;
      subscription?.remove();
      if (fallbackTimer !== undefined) clearTimeout(fallbackTimer);
    };
  }, [enabled, attempt]);

  const retry = useCallback(() => {
    setManualFix(null);
    setAttempt((value) => value + 1);
  }, []);

  const setManual = useCallback((coordinate: Coordinate) => {
    setManualFix({
      coordinate,
      accuracy: 0,
      heading: null,
      speed: null,
      timestamp: Date.now(),
      lowAccuracy: false,
      manual: true,
    });
  }, []);

  const clearManual = useCallback(() => {
    setManualFix(null);
    setAttempt((value) => value + 1);
  }, []);

  const fix = manualFix ?? rawFix;

  return {
    fix,
    message: manualFix ? 'Đang dùng vị trí bạn chọn trên bản đồ' : message,
    suspicious: !manualFix && rejected !== null,
    rejected: manualFix ? null : rejected,
    manual: manualFix !== null,
    retry,
    setManual,
    clearManual,
  };
}
