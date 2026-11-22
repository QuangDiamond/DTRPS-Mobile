import { Image, Modal, Pressable, View } from 'react-native';
import { Text } from '../ui/Typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../ui/Icon';

/** Xem ảnh phóng to (Lightbox) */
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
          {current ? <Image source={{ uri: current }} style={{ width: '100%', height: '100%' }} resizeMode="contain" /> : null}
          {images.length > 1 && index !== null ? (
            <>
              <Pressable
                onPress={() => onChange((index - 1 + images.length) % images.length)}
                accessibilityLabel="Ảnh trước"
                className="absolute left-3 h-11 w-11 items-center justify-center rounded-full bg-white/15"
              >
                <Icon name="chevron-left" size={28} color="#FFFFFF" />
              </Pressable>
              <Pressable
                onPress={() => onChange((index + 1) % images.length)}
                accessibilityLabel="Ảnh tiếp theo"
                className="absolute right-3 h-11 w-11 items-center justify-center rounded-full bg-white/15"
              >
                <Icon name="chevron-right" size={28} color="#FFFFFF" />
              </Pressable>
            </>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
