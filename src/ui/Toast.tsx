import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Text } from './Typography';

/** Thông báo ngắn tự ẩn (giống useNotice + NoticeToast của web) */
export function useToast(initial: string | null = null): [string | null, (message: string) => void] {
  const [message, setMessage] = useState<string | null>(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((next: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(next);
    timer.current = setTimeout(() => setMessage(null), 3200);
  }, []);
  useEffect(() => {
    if (initial) show(initial);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [initial, show]);
  return [message, show];
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View pointerEvents="none" className="absolute bottom-6 left-4 right-4 items-center">
      <View className="rounded-2xl bg-[#0F2A3B] px-4 py-3" style={{ elevation: 6 }}>
        <Text className="text-center text-[13px] font-semibold text-white">{message}</Text>
      </View>
    </View>
  );
}
