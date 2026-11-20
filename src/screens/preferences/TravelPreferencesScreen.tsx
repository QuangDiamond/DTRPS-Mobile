import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { userApi, type UserPreferences } from '../../services/userApi';
import { referenceApi } from '../../services/referenceApi';
import { errorMessage } from '../../services/httpClient';
import { EXPERIENCE_QUESTIONS } from './experienceQuestions';
import { toSpecialNeedOptions, type IconOption } from './preferenceOptions';
import ExperienceQuestionGrid from './ExperienceQuestionGrid';

/**
 * Sở thích du lịch (UC-006) — port thật của DTRPS-Web/TravelPreferencesPage.tsx: 4 câu hỏi cá
 * nhân hóa (mỗi câu một bước) + bước "Yêu cầu đặc biệt", đọc/lưu qua GET/PUT
 * /api/users/me/preferences. Không nhận props từ màn cha — tự tải/tự lưu, giống Web.
 */

type TravelPreferencesScreenProps = {
  onBack: () => void;
};

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

const TOTAL_STEPS = EXPERIENCE_QUESTIONS.length + 1; // + Yêu cầu đặc biệt

const STEP_TITLES = [
  ...EXPERIENCE_QUESTIONS.map((q) => ({ title: q.title, subtitle: q.subtitle })),
  { title: 'Yêu cầu đặc biệt', subtitle: 'Bạn có yêu cầu đặc biệt nào không? (Chọn nếu có)' },
];

const EMPTY: UserPreferences = {
  notes: null,
  interests: [],
  specialNeeds: [],
  experiencePreferences: [],
};

function IconList({
  options,
  isSelected,
  onToggle,
}: {
  options: IconOption[];
  isSelected: (id: string) => boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <View>
      {options.map((option) => {
        const selected = isSelected(option.id);
        return (
          <Pressable
            key={option.id}
            onPress={() => onToggle(option.id)}
            className="mb-3 flex-row items-center rounded-2xl px-4 py-3.5"
            style={{
              borderWidth: selected ? 2 : 1,
              borderColor: selected ? COLORS.primary : COLORS.border,
              backgroundColor: selected ? COLORS.selectedBg : COLORS.white,
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
          >
            <View
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: selected ? '#D4F1EC' : '#F4F6F8' }}
            >
              <MaterialCommunityIcons name={option.icon} size={22} color={COLORS.primary} />
            </View>
            <Text className="ml-3 flex-1 text-[14px] font-medium" style={{ color: COLORS.text }}>
              {option.label}
            </Text>
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
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TravelPreferencesScreen({ onBack }: TravelPreferencesScreenProps) {
  const [step, setStep] = useState(0);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [specialNeedOptions, setSpecialNeedOptions] = useState<IconOption[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    userApi
      .preferences()
      .then((result) => active && setPreferences({ ...EMPTY, ...result }))
      .catch((caught: unknown) => {
        if (!active) return;
        setLoadError(errorMessage(caught));
        setPreferences(EMPTY);
      });
    referenceApi
      .specialNeeds()
      .then((items) => active && setSpecialNeedOptions(toSpecialNeedOptions(items)))
      .catch((caught: unknown) => {
        if (!active) return;
        setLoadError(errorMessage(caught));
        setSpecialNeedOptions([]);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!preferences || !specialNeedOptions) {
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 items-center justify-center" style={{ backgroundColor: COLORS.background }}>
        <ActivityIndicator color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  const isLastStep = step === TOTAL_STEPS - 1;

  const toggleSpecialNeed = (id: string) =>
    setPreferences((previous) =>
      previous
        ? {
            ...previous,
            specialNeeds: previous.specialNeeds.includes(id)
              ? previous.specialNeeds.filter((item) => item !== id)
              : [...previous.specialNeeds, id],
          }
        : previous,
    );

  const toggleExperience = (code: string) =>
    setPreferences((previous) =>
      previous
        ? {
            ...previous,
            experiencePreferences: previous.experiencePreferences.includes(code)
              ? previous.experiencePreferences.filter((item) => item !== code)
              : [...previous.experiencePreferences, code],
          }
        : previous,
    );

  // Mỗi câu cá nhân hóa (4 bước đầu) cần chọn ít nhất 1 đáp án; yêu cầu đặc biệt không bắt buộc.
  const canContinue =
    step < EXPERIENCE_QUESTIONS.length
      ? EXPERIENCE_QUESTIONS[step].options.some((option) =>
          preferences.experiencePreferences.includes(option.code),
        )
      : true;

  const finish = async () => {
    setSaving(true);
    setError(null);
    try {
      await userApi.updatePreferences(preferences);
      setDone(true);
      setTimeout(onBack, 1200);
    } catch (caught) {
      setError(errorMessage(caught));
      setSaving(false);
    }
  };

  const goNext = () => {
    if (isLastStep) void finish();
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
    if (step < EXPERIENCE_QUESTIONS.length) {
      return (
        <ExperienceQuestionGrid
          options={EXPERIENCE_QUESTIONS[step].options}
          selected={preferences.experiencePreferences}
          onToggle={toggleExperience}
        />
      );
    }
    return (
      <IconList
        options={specialNeedOptions}
        isSelected={(id) => preferences.specialNeeds.includes(id)}
        onToggle={toggleSpecialNeed}
      />
    );
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1" style={{ backgroundColor: COLORS.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View className="h-[56px] flex-row items-center px-3">
        <Pressable onPress={handleBack} hitSlop={8} className="h-9 w-9 items-center justify-center" accessibilityLabel="Quay lại">
          <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.text} />
        </Pressable>
        <Text className="ml-1 text-[17px] font-bold" style={{ color: COLORS.text }}>
          Sở thích du lịch
        </Text>
      </View>

      <View className="flex-row items-center px-5 pt-1">
        <View className="h-[7px] flex-1 overflow-hidden rounded-full" style={{ backgroundColor: COLORS.track }}>
          <View
            className="h-full rounded-full"
            style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%`, backgroundColor: COLORS.primary }}
          />
        </View>
        <Text className="ml-3 text-[12px]" style={{ color: COLORS.muted }}>
          {step + 1}/{TOTAL_STEPS}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 }}
      >
        {loadError && (
          <Text className="mb-3 text-[12px]" style={{ color: '#B91C1C' }}>
            Không tải được sở thích đã lưu: {loadError}
          </Text>
        )}
        <Text className="text-[19px] font-extrabold" style={{ color: COLORS.text }}>
          {STEP_TITLES[step].title}
        </Text>
        <Text className="mb-5 mt-1 text-[13px] leading-5" style={{ color: COLORS.muted }}>
          {STEP_TITLES[step].subtitle}
        </Text>

        {renderStep()}

        {error && (
          <Text className="mt-4 text-[12px]" style={{ color: '#B91C1C' }}>
            {error}
          </Text>
        )}
        {done && (
          <View className="mt-4 flex-row items-center rounded-2xl p-3" style={{ backgroundColor: '#E5F5F0' }}>
            <MaterialCommunityIcons name="check-circle" size={18} color="#356D64" />
            <Text className="ml-2 flex-1 text-[12px]" style={{ color: '#356D64' }}>
              Đã lưu sở thích. SmartTravel sẽ gợi ý điểm đến và lịch trình phù hợp hơn với bạn.
            </Text>
          </View>
        )}
      </ScrollView>

      <View className="flex-row gap-3 px-5 pb-3 pt-2">
        <Pressable
          onPress={goNext}
          disabled={saving || done}
          className="h-12 flex-1 items-center justify-center rounded-2xl active:opacity-70"
          style={{ backgroundColor: '#F2F4F6', opacity: saving || done ? 0.6 : 1 }}
        >
          <Text className="text-[14px] font-semibold" style={{ color: COLORS.text }}>
            Bỏ qua
          </Text>
        </Pressable>

        <Pressable
          onPress={handleContinue}
          disabled={saving || done}
          className="h-12 items-center justify-center rounded-2xl active:opacity-80"
          style={{ flex: 1.6, backgroundColor: COLORS.primary, opacity: canContinue && !saving && !done ? 1 : 0.5 }}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-[14px] font-bold text-white">
              {isLastStep ? 'Hoàn tất' : 'Tiếp tục'}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
