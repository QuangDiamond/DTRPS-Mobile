import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { planDestinations } from '../../constants/planTrip';

// ==================== TYPES ====================

type GeneratingTripScreenProps = {
  destinationId: string;
  days: number;
  onCancel: () => void;
  /** Gọi khi người dùng bấm xem địa điểm gợi ý sau khi tạo xong */
  onDone: () => void;
};

// ==================== CONFIG ====================

const COLORS = {
  primary: '#087A78',
  primaryDark: '#075C66',
  text: '#13364A',
  muted: '#72818C',
  background: '#F8F8FF',
  lightPurple: '#EBEDFF',
  mint: '#C3F8F0',
  white: '#FFFFFF',
};

/** Tổng thời gian giả lập tạo lịch trình (ms) */
const TOTAL_DURATION = 8000;

const steps = [
  { doing: 'Đang chọn lọc danh lam thắng cảnh phù hợp', done: 'Đã chọn lọc danh lam thắng cảnh phù hợp' },
  { doing: 'Đang cập nhật thông tin thời tiết dự báo', done: 'Đã cập nhật thông tin thời tiết dự báo' },
  { doing: 'Đang cân đối thời gian và lộ trình di chuyển', done: 'Đã cân đối thời gian và lộ trình di chuyển' },
  { doing: 'Chuẩn bị bảng dự toán chi phí theo ngân sách', done: 'Đã lập bảng dự toán chi phí theo ngân sách' },
];

// ==================== GLOBE ANIMATION ====================

function GlobeAnimation({ finished }: { finished: boolean }) {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );

    spinLoop.start();
    pulseLoop.start();

    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [spin, pulse]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <View className="h-[210px] w-[210px] items-center justify-center self-center">
      {/* Vòng sáng ngoài */}
      <Animated.View
        className="absolute h-[200px] w-[200px] rounded-full"
        style={{
          borderWidth: 1,
          borderColor: '#D8EEF0',
          backgroundColor: '#F2FBFA',
          transform: [{ scale }],
        }}
      />
      <View
        className="absolute h-[160px] w-[160px] rounded-full"
        style={{ borderWidth: 1, borderColor: '#D8EEF0' }}
      />

      {/* Quỹ đạo quay: máy bay + chấm */}
      <Animated.View
        className="absolute h-[200px] w-[200px]"
        style={{ transform: [{ rotate }] }}
      >
        <View
          className="absolute right-[18px] top-[18px] h-8 w-8 items-center justify-center rounded-full bg-white"
          style={{ elevation: 3, shadowOpacity: 0.12, shadowRadius: 6 }}
        >
          <MaterialCommunityIcons name="airplane" size={17} color={COLORS.primaryDark} />
        </View>
        <View
          className="absolute bottom-[30px] left-[12px] h-3 w-3 rounded-full border-2 border-white"
          style={{ backgroundColor: '#1BB59F' }}
        />
      </Animated.View>

      {/* Quả địa cầu */}
      <View
        className="h-[118px] w-[118px] items-center justify-center rounded-full bg-white"
        style={{ elevation: 6, shadowOpacity: 0.1, shadowRadius: 12 }}
      >
        <MaterialCommunityIcons
          name={finished ? 'check-decagram' : 'web'}
          size={72}
          color={finished ? COLORS.primary : '#2BB5A3'}
        />
      </View>
    </View>
  );
}

// ==================== MAIN SCREEN ====================

export default function GeneratingTripScreen({
  destinationId,
  days,
  onCancel,
  onDone,
}: GeneratingTripScreenProps) {
  const destination =
    planDestinations.find((item) => item.id === destinationId) ?? planDestinations[0];

  const [elapsed, setElapsed] = useState(0);
  const progressBar = useRef(new Animated.Value(0)).current;

  // Giả lập tiến trình tạo lịch trình
  useEffect(() => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const next = Math.min(TOTAL_DURATION, Date.now() - startedAt);
      setElapsed(next);
      if (next >= TOTAL_DURATION) clearInterval(timer);
    }, 100);

    Animated.timing(progressBar, {
      toValue: 1,
      duration: TOTAL_DURATION,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    return () => clearInterval(timer);
  }, [progressBar]);

  const ratio = elapsed / TOTAL_DURATION;
  const finished = ratio >= 1;
  const percent = Math.round(Easing.out(Easing.quad)(ratio) * 100);
  const currentStep = Math.min(steps.length, Math.floor(ratio * steps.length));
  const doneSteps = finished ? steps.length : currentStep;

  const handleCancel = () => {
    if (finished) {
      onCancel();
      return;
    }

    Alert.alert('Hủy tạo lịch trình?', 'Tiến trình hiện tại sẽ không được lưu.', [
      { text: 'Tiếp tục tạo', style: 'cancel' },
      { text: 'Hủy', style: 'destructive', onPress: onCancel },
    ]);
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1"
      style={{ backgroundColor: COLORS.white }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 20, paddingBottom: 16 }}
      >
        <GlobeAnimation finished={finished} />

        {/* ================= TITLE ================= */}

        <View
          className="mt-2 flex-row items-center self-center rounded-full px-3 py-1"
          style={{ backgroundColor: COLORS.lightPurple }}
        >
          <MaterialCommunityIcons name="compass-outline" size={13} color={COLORS.primaryDark} />
          <Text className="ml-1 text-[11px] font-semibold" style={{ color: COLORS.primaryDark }}>
            Hành trình cá nhân hóa
          </Text>
        </View>

        <Text
          className="mt-3 text-center text-[21px] font-extrabold leading-7"
          style={{ color: COLORS.text }}
        >
          {finished ? 'Hành trình của bạn đã sẵn sàng!' : 'Đang chuẩn bị hành trình hoàn hảo...'}
        </Text>
        <Text
          className="mt-2 text-center text-[12px] leading-5"
          style={{ color: COLORS.muted }}
        >
          Hệ thống đang đối chiếu dữ liệu điểm đến, thời tiết và khoảng cách di chuyển tại{' '}
          <Text className="font-bold" style={{ color: COLORS.primary }}>
            {destination.short}
          </Text>
          .
        </Text>

        {/* ================= PROGRESS ================= */}

        <View
          className="mt-5 rounded-[20px] bg-white p-4"
          style={{ borderWidth: 1, borderColor: '#ECEFF5' }}
        >
          <View className="flex-row items-start">
            <Text className="flex-1 text-[14px] font-bold" style={{ color: COLORS.text }}>
              Đang tổng hợp thông tin địa điểm
            </Text>
            <Text className="ml-2 mt-0.5 text-[11px]" style={{ color: COLORS.muted }}>
              ({doneSteps}/{steps.length} bước)
            </Text>
            <Text className="ml-2 text-[16px] font-extrabold" style={{ color: COLORS.primary }}>
              {percent}%
            </Text>
          </View>

          <View
            className="mt-2.5 h-[7px] overflow-hidden rounded-full"
            style={{ backgroundColor: '#E3E8EF' }}
          >
            <Animated.View
              className="h-full rounded-full"
              style={{
                backgroundColor: COLORS.primaryDark,
                width: progressBar.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              }}
            />
          </View>

          <View className="mt-3">
            {steps.map((step, index) => {
              const status =
                index < doneSteps ? 'done' : index === currentStep ? 'doing' : 'waiting';

              return (
                <View
                  key={step.done}
                  className="mb-2 flex-row items-center rounded-2xl px-3 py-2.5"
                  style={{
                    backgroundColor:
                      status === 'doing' ? '#E2FAF5' : status === 'done' ? '#F4F6FB' : 'transparent',
                    borderWidth: status === 'doing' ? 1 : 0,
                    borderColor: '#9FE3D6',
                  }}
                >
                  {status === 'done' && (
                    <View
                      className="h-6 w-6 items-center justify-center rounded-full"
                      style={{ backgroundColor: COLORS.primaryDark }}
                    >
                      <MaterialCommunityIcons name="check" size={15} color="white" />
                    </View>
                  )}
                  {status === 'doing' && (
                    <View className="h-6 w-6 items-center justify-center">
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    </View>
                  )}
                  {status === 'waiting' && (
                    <View
                      className="h-6 w-6 rounded-full"
                      style={{ borderWidth: 1.5, borderColor: '#D0D6DE' }}
                    />
                  )}

                  <Text
                    numberOfLines={1}
                    className={`ml-2.5 flex-1 text-[12px] ${status === 'waiting' ? '' : 'font-semibold'}`}
                    style={{ color: status === 'waiting' ? '#A7B0B8' : COLORS.text }}
                  >
                    {status === 'done' ? step.done : step.doing}
                  </Text>

                  <Text
                    className="ml-2 text-[11px] font-semibold"
                    style={{
                      color:
                        status === 'done' ? COLORS.primaryDark : status === 'doing' ? COLORS.primary : '#A7B0B8',
                    }}
                  >
                    {status === 'done' ? 'Xong' : status === 'doing' ? '•••' : 'Chờ'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ================= PREVIEW ================= */}

        <View
          className="mt-4 flex-row items-center rounded-[18px] bg-white p-2.5"
          style={{ borderWidth: 1, borderColor: '#ECEFF5' }}
        >
          <Image source={{ uri: destination.image }} className="h-16 w-20 rounded-xl" />
          <View className="ml-3 min-w-0 flex-1">
            <View className="flex-row items-center">
              <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: COLORS.lightPurple }}>
                <Text className="text-[10px] font-semibold" style={{ color: '#445577' }}>
                  Hành trình {days}N{Math.max(days - 1, 0)}Đ
                </Text>
              </View>
              <Text className="ml-1.5 text-[10px]" style={{ color: COLORS.muted }}>
                • {destination.region}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              className="mt-1 text-[14px] font-extrabold"
              style={{ color: COLORS.text }}
            >
              {destination.previewTitle}
            </Text>
            <Text numberOfLines={1} className="text-[11px]" style={{ color: COLORS.muted }}>
              {destination.previewSubtitle}
            </Text>
          </View>
        </View>

        {/* ================= TIP ================= */}

        <View className="mt-4 flex-row rounded-[18px] p-4" style={{ backgroundColor: '#FFF4EC' }}>
          <View
            className="h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: '#FFE3CC' }}
          >
            <MaterialCommunityIcons name="weather-sunset" size={18} color="#C25E00" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-[13px] font-bold" style={{ color: '#A14F00' }}>
              Mẹo nhỏ khi du lịch {destination.tipPlace}
            </Text>
            <Text className="mt-1 text-[12px] leading-5" style={{ color: '#5E4636' }}>
              {destination.tip}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ================= FOOTER ================= */}

      <View className="px-5 pb-3 pt-2">
        <Pressable
          onPress={onDone}
          disabled={!finished}
          className="h-12 flex-row items-center justify-center rounded-full active:opacity-80"
          style={{ backgroundColor: finished ? COLORS.primaryDark : COLORS.lightPurple }}
        >
          <MaterialCommunityIcons
            name={finished ? 'map-search-outline' : 'clock-outline'}
            size={18}
            color={finished ? 'white' : COLORS.primaryDark}
          />
          <Text
            className="ml-2 text-[14px] font-bold"
            style={{ color: finished ? 'white' : COLORS.primaryDark }}
          >
            {finished ? 'Xem địa điểm gợi ý' : 'Đang hoàn tất các bước cuối...'}
          </Text>
        </Pressable>

        <Pressable onPress={handleCancel} className="items-center py-3" hitSlop={6}>
          <Text className="text-[12px]" style={{ color: COLORS.muted }}>
            {finished ? 'Quay lại chỉnh sửa' : 'Hủy tạo lịch trình'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
