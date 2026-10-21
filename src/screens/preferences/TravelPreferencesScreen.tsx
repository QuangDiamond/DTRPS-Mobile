import React, { useState } from 'react';
import {
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  budgetOptions,
  emptyPreferences,
  interestOptions,
  specialNeedOptions,
  styleOptions,
  transportOptions,
  type IconOption,
  type ImageOption,
  type TravelPreferences,
} from '../../constants/travelPreferences';

// ==================== TYPES ====================

type TravelPreferencesScreenProps = {
  initialPreferences?: TravelPreferences;
  onBack: () => void;
  onComplete?: (preferences: TravelPreferences) => void;
};

// ==================== COLORS ====================

const COLORS = {
  primary: '#00685F',
  text: '#131B2E',
  muted: '#64716F',
  background: '#FFFFFF',
  border: '#E6EAF0',
  selectedBg: '#F0FAF8',
  track: '#E6EAF0',
  white: '#FFFFFF',
};

const TOTAL_STEPS = 5;

const steps = [
  {
    title: 'Bạn thích trải nghiệm gì?',
    subtitle: 'Chọn những hoạt động bạn yêu thích nhất\n(Chọn nhiều mục)',
  },
  {
    title: 'Mức ngân sách',
    subtitle: 'Bạn thường chi bao nhiêu cho một chuyến đi?',
  },
  {
    title: 'Phương tiện di chuyển',
    subtitle: 'Bạn thường sử dụng phương tiện nào?',
  },
  {
    title: 'Phong cách du lịch',
    subtitle: 'Chọn phong cách phù hợp với bạn',
  },
  {
    title: 'Yêu cầu đặc biệt',
    subtitle: 'Bạn có yêu cầu đặc biệt nào không?\n(Chọn nếu có)',
  },
];

// ==================== OPTION COMPONENTS ====================

function CheckBadge({ selected }: { selected: boolean }) {
  return (
    <View
      className="h-6 w-6 items-center justify-center rounded-full border-2 border-white"
      style={{ backgroundColor: selected ? COLORS.primary : 'rgba(0,0,0,0.15)' }}
    >
      {selected && <MaterialCommunityIcons name="check" size={14} color="white" />}
    </View>
  );
}

/** Thẻ ảnh 2 cột (bước 1 và bước 4) */
function ImageGrid({
  options,
  isSelected,
  onPress,
}: {
  options: ImageOption[];
  isSelected: (id: string) => boolean;
  onPress: (id: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap justify-between">
      {options.map((option) => {
        const selected = isSelected(option.id);

        return (
          <Pressable
            key={option.id}
            onPress={() => onPress(option.id)}
            className="mb-3 overflow-hidden rounded-2xl"
            style={{
              width: '48%',
              borderWidth: 2,
              borderColor: selected ? COLORS.primary : COLORS.border,
              backgroundColor: selected ? COLORS.selectedBg : COLORS.white,
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
          >
            <ImageBackground
              source={{ uri: option.image }}
              style={{ height: 105, alignItems: 'flex-end', padding: 6 }}
            >
              {selected && <CheckBadge selected />}
            </ImageBackground>

            <View className="min-h-[44px] justify-center px-2.5 py-2">
              <Text
                className="text-[12px] font-semibold"
                style={{ color: COLORS.text }}
              >
                {option.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Danh sách có icon (bước 2, 3, 5) */
function IconList({
  options,
  isSelected,
  onPress,
  variant,
}: {
  options: IconOption[];
  isSelected: (id: string) => boolean;
  onPress: (id: string) => void;
  /** single: dấu tích tròn khi chọn; multi: ô checkbox vuông */
  variant: 'single' | 'multi';
}) {
  return (
    <View>
      {options.map((option) => {
        const selected = isSelected(option.id);

        return (
          <Pressable
            key={option.id}
            onPress={() => onPress(option.id)}
            className={`mb-3 flex-row items-center rounded-2xl px-4 ${option.note ? 'py-4' : 'py-3.5'}`}
            style={{
              borderWidth: selected ? 2 : 1,
              borderColor: selected ? COLORS.primary : COLORS.border,
              backgroundColor: selected ? COLORS.selectedBg : COLORS.white,
            }}
            accessibilityRole={variant === 'single' ? 'radio' : 'checkbox'}
            accessibilityState={{ checked: selected }}
          >
            <View
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: selected ? '#D4F1EC' : '#F4F6F8' }}
            >
              <MaterialCommunityIcons name={option.icon} size={22} color={COLORS.primary} />
            </View>

            <View className="ml-3 flex-1">
              <Text
                className={`text-[14px] ${option.note ? 'font-bold' : 'font-medium'}`}
                style={{ color: COLORS.text }}
              >
                {option.label}
              </Text>
              {option.note && (
                <Text className="mt-0.5 text-[12px]" style={{ color: COLORS.muted }}>
                  {option.note}
                </Text>
              )}
            </View>

            {variant === 'multi' ? (
              <View
                className="h-5 w-5 items-center justify-center rounded-md"
                style={{
                  borderWidth: selected ? 0 : 1.5,
                  borderColor: '#C5CDD3',
                  backgroundColor: selected ? COLORS.primary : 'transparent',
                }}
              >
                {selected && <MaterialCommunityIcons name="check" size={15} color="white" />}
              </View>
            ) : (
              selected && <CheckBadge selected />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ==================== MAIN SCREEN ====================

export default function TravelPreferencesScreen({
  initialPreferences = emptyPreferences,
  onBack,
  onComplete,
}: TravelPreferencesScreenProps) {
  const [step, setStep] = useState(0);
  const [preferences, setPreferences] = useState<TravelPreferences>(initialPreferences);

  const isLastStep = step === TOTAL_STEPS - 1;

  const toggleIn = (key: 'interests' | 'transports' | 'specialNeeds', id: string) => {
    setPreferences((previous) => {
      const list = previous[key];
      return {
        ...previous,
        [key]: list.includes(id) ? list.filter((item) => item !== id) : [...list, id],
      };
    });
  };

  // Bước hiện tại đã chọn đủ để Tiếp tục chưa (bước 5 không bắt buộc)
  const canContinue = [
    preferences.interests.length > 0,
    preferences.budget !== null,
    preferences.transports.length > 0,
    preferences.style !== null,
    true,
  ][step];

  const finish = () => {
    if (onComplete) {
      onComplete(preferences);
      return;
    }

    Alert.alert(
      'Đã lưu sở thích',
      'SmartTravel sẽ gợi ý điểm đến và lịch trình phù hợp hơn với bạn.',
      [{ text: 'OK', onPress: onBack }]
    );
  };

  const goNext = () => {
    if (isLastStep) finish();
    else setStep((previous) => previous + 1);
  };

  const handleContinue = () => {
    if (!canContinue) {
      Alert.alert('Chưa chọn', 'Hãy chọn ít nhất một mục hoặc bấm "Bỏ qua".');
      return;
    }
    goNext();
  };

  const handleBack = () => {
    if (step > 0) setStep((previous) => previous - 1);
    else onBack();
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <ImageGrid
            options={interestOptions}
            isSelected={(id) => preferences.interests.includes(id)}
            onPress={(id) => toggleIn('interests', id)}
          />
        );
      case 1:
        return (
          <IconList
            variant="single"
            options={budgetOptions}
            isSelected={(id) => preferences.budget === id}
            onPress={(id) => setPreferences((previous) => ({ ...previous, budget: id }))}
          />
        );
      case 2:
        return (
          <IconList
            variant="multi"
            options={transportOptions}
            isSelected={(id) => preferences.transports.includes(id)}
            onPress={(id) => toggleIn('transports', id)}
          />
        );
      case 3:
        return (
          <ImageGrid
            options={styleOptions}
            isSelected={(id) => preferences.style === id}
            onPress={(id) => setPreferences((previous) => ({ ...previous, style: id }))}
          />
        );
      default:
        return (
          <IconList
            variant="multi"
            options={specialNeedOptions}
            isSelected={(id) => preferences.specialNeeds.includes(id)}
            onPress={(id) => toggleIn('specialNeeds', id)}
          />
        );
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1"
      style={{ backgroundColor: COLORS.background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* ================= HEADER ================= */}

      <View className="h-[56px] flex-row items-center px-3">
        <Pressable
          onPress={handleBack}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center"
          accessibilityLabel="Quay lại"
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.text} />
        </Pressable>
        <Text className="ml-1 text-[17px] font-bold" style={{ color: COLORS.text }}>
          Sở thích du lịch
        </Text>
      </View>

      {/* ================= PROGRESS ================= */}

      <View className="flex-row items-center px-5 pt-1">
        <View
          className="h-[7px] flex-1 overflow-hidden rounded-full"
          style={{ backgroundColor: COLORS.track }}
        >
          <View
            className="h-full rounded-full"
            style={{
              width: `${((step + 1) / TOTAL_STEPS) * 100}%`,
              backgroundColor: COLORS.primary,
            }}
          />
        </View>
        <Text className="ml-3 text-[12px]" style={{ color: COLORS.muted }}>
          {step + 1}/{TOTAL_STEPS}
        </Text>
      </View>

      {/* ================= CONTENT ================= */}

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 }}
      >
        <Text className="text-[19px] font-extrabold" style={{ color: COLORS.text }}>
          {steps[step].title}
        </Text>
        <Text className="mb-5 mt-1 text-[13px] leading-5" style={{ color: COLORS.muted }}>
          {steps[step].subtitle}
        </Text>

        {renderStep()}
      </ScrollView>

      {/* ================= FOOTER ================= */}

      <View className="flex-row gap-3 px-5 pb-3 pt-2">
        <Pressable
          onPress={goNext}
          className="h-12 flex-1 items-center justify-center rounded-2xl active:opacity-70"
          style={{ backgroundColor: '#F2F4F6' }}
        >
          <Text className="text-[14px] font-semibold" style={{ color: COLORS.text }}>
            Bỏ qua
          </Text>
        </Pressable>

        <Pressable
          onPress={handleContinue}
          className="h-12 items-center justify-center rounded-2xl active:opacity-80"
          style={{
            flex: 1.6,
            backgroundColor: COLORS.primary,
            opacity: canContinue ? 1 : 0.5,
          }}
        >
          <Text className="text-[14px] font-bold text-white">
            {isLastStep ? 'Hoàn tất' : 'Tiếp tục'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
