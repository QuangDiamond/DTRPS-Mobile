import { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, View } from 'react-native';
import { Text } from '../ui/Typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../ui/Icon';
import { ScalePressable } from '../ui/Motion';

/** Xem ảnh phóng to (Lightbox) — hiệu ứng phóng mượt + đổi ảnh mượt */
export default function ImageViewer({
  images,
  index,
  onChange,
  onClose,
}: {
  images: string[];
  index: number | null;
  onChange: (next: number) => void;
  onClose: () => void;
}) {
  const visible = index !== null && images.length > 0;
  const current = visible ? images[Math.min(index, images.length - 1)] : null;
  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.92);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 24,
        bounciness: 5,
      }),
    ]).start();
  }, [visible, index, opacity, scale]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.94)' }}>
        <View className="flex-row items-center justify-between px-4 py-2">
          <Text className="text-[13px] font-bold text-white">
            {visible ? `${(index ?? 0) + 1} / ${images.length}` : ''}
          </Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Đóng">
            <Icon name="close" size={26} color="#FFFFFF" />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center">
          {current ? (
            <Animated.Image
              source={{ uri: current }}
              style={{ width: '100%', height: '100%', opacity, transform: [{ scale }] }}
              resizeMode="contain"
            />
          ) : null}
          {images.length > 1 && index !== null ? (
            <>
              <View className="absolute left-3">
                <ScalePressable
                  scaleTo={0.9}
                  onPress={() => onChange((index - 1 + images.length) % images.length)}
                  accessibilityLabel="Ảnh trước"
                  className="h-11 w-11 items-center justify-center rounded-full bg-white/15"
                >
                  <Icon name="chevron-left" size={28} color="#FFFFFF" />
                </ScalePressable>
              </View>
              <View className="absolute right-3">
                <ScalePressable
                  scaleTo={0.9}
                  onPress={() => onChange((index + 1) % images.length)}
                  accessibilityLabel="Ảnh tiếp theo"
                  className="h-11 w-11 items-center justify-center rounded-full bg-white/15"
                >
                  <Icon name="chevron-right" size={28} color="#FFFFFF" />
                </ScalePressable>
              </View>
            </>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
