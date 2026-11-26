import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../../ui/Typography';
import { errorMessage } from '../../api/http';
import { referenceApi } from '../../api/referenceApi';
import type { ReferenceItem, TravelPreferences } from '../../api/types';
import { userApi } from '../../api/userApi';
import { EXPERIENCE_QUESTIONS } from '../../data/planTrip';
import type { RootScreenProps } from '../../navigation/types';
import { colors } from '../../theme';
import { Button } from '../../ui/Button';
import { Icon, type IconName } from '../../ui/Icon';
import { Header, Screen } from '../../ui/Screen';
import { Notice } from '../../ui/States';
import { ListCardSkeleton } from '../../ui/Motion';

// 4 câu hỏi cá nhân hóa, mỗi câu một bước, cộng bước "Yêu cầu đặc biệt" (giống web)
const STEPS = [
  ...EXPERIENCE_QUESTIONS.map((question) => ({
    title: question.title,
    subtitle: question.subtitle,
  })),
  { title: 'Yêu cầu đặc biệt', subtitle: 'Bạn có yêu cầu đặc biệt nào không? (Chọn nếu có)' },
];

const EMPTY: TravelPreferences = {
  notes: null,
  interests: [],
  specialNeeds: [],
  experiencePreferences: [],
};

/** Icon theo mã yêu cầu đặc biệt của Backend (giống preferenceOptions.ts của web) */
const SPECIAL_NEED_ICONS: Record<string, IconName> = {
  vegetarian: 'eco',
  kids: 'child-care',
  elderly: 'elderly',
  pets: 'pets',
  disability: 'accessible',
  largeGroup: 'groups',
  limitedMobility: 'weekend',
  quietSpace: 'self-improvement',
};

/** Sở thích du lịch (UC-006) — GET/PUT /api/users/me/preferences, giống TravelPreferencesPage của web */
export default function PreferencesScreen({ navigation, route }: RootScreenProps<'Preferences'>) {
  const welcome = route.params?.notice;
  const [step, setStep] = useState(0);
  const [preferences, setPreferences] = useState<TravelPreferences | null>(null);
  const [specialNeeds, setSpecialNeeds] = useState<ReferenceItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    userApi
      .preferences()
      .then((result) => active && setPreferences({ ...EMPTY, ...result }))
      .catch((failure: unknown) => {
        if (!active) return;
        setLoadError(errorMessage(failure));
        setPreferences(EMPTY);
      });
    referenceApi
      .specialNeeds()
      .then((items) => active && setSpecialNeeds(items))
      .catch((failure: unknown) => {
        if (!active) return;
        setLoadError(errorMessage(failure));
        setSpecialNeeds([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const header = (
    <Header
      title="Sở thích du lịch"
      onBack={() => {
        setError(null);
        if (step > 0) setStep((s) => s - 1);
        else navigation.goBack();
      }}
    />
  );

  if (!preferences || !specialNeeds) {
    return (
      <Screen header={header}>
        <ListCardSkeleton count={3} />
      </Screen>
    );
  }

  const isLastStep = step === STEPS.length - 1;
  const toggle = (key: 'experiencePreferences' | 'specialNeeds', code: string) =>
    setPreferences((previous) =>
      previous
        ? {
            ...previous,
            [key]: previous[key].includes(code)
              ? previous[key].filter((item) => item !== code)
              : [...previous[key], code],
          }
        : previous,
    );

  // Mỗi câu cá nhân hóa cần chọn ít nhất một đáp án; yêu cầu đặc biệt không bắt buộc
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
      setTimeout(
        () =>
          navigation.canGoBack()
            ? navigation.goBack()
            : navigation.navigate('Tabs', { screen: 'Home' }),
        1500,
      );
    } catch (saveError) {
      setError(errorMessage(saveError));
      setSaving(false);
    }
  };

  const goNext = () => (isLastStep ? void finish() : setStep((s) => s + 1));

  return (
    <Screen
      header={header}
      footer={
        <View className="flex-row gap-2.5 border-t border-[#E5F1F4] bg-white px-4 pb-4 pt-3">
          <View className="flex-1">
            <Button title="Bỏ qua" variant="outline" disabled={saving || done} onPress={goNext} />
          </View>
          <View className="flex-[1.6]">
            <Button
              title={isLastStep ? 'Lưu sở thích' : 'Tiếp tục'}
              iconRight={isLastStep ? 'check' : 'arrow-forward'}
              loading={saving}
              disabled={done}
              onPress={() => {
                if (!canContinue) return setError('Hãy chọn ít nhất một mục hoặc bấm "Bỏ qua".');
                setError(null);
                goNext();
              }}
            />
          </View>
        </View>
      }
    >
      {welcome && step === 0 ? <Notice tone="success">{welcome}</Notice> : null}

      <View className="mb-4 flex-row items-center gap-3">
        <View className="h-2 flex-1 overflow-hidden rounded-full bg-[#E6EEF1]">
          <View
            style={{
              width: `${((step + 1) / STEPS.length) * 100}%`,
              height: '100%',
              backgroundColor: colors.primary,
            }}
          />
        </View>
        <Text className="text-[12px] font-bold text-[#557080]">
          {step + 1}/{STEPS.length}
        </Text>
      </View>

      <Text className="text-[20px] font-extrabold leading-7 text-[#13364A]">
        {STEPS[step].title}
      </Text>
      <Text className="mb-4 mt-1 text-[13px] text-[#72818C]">{STEPS[step].subtitle}</Text>

      {loadError ? (
        <Notice tone="danger">{`Không tải được sở thích đã lưu: ${loadError}`}</Notice>
      ) : null}

      {step < EXPERIENCE_QUESTIONS.length ? (
        <View className="flex-row flex-wrap justify-between gap-y-3">
          {EXPERIENCE_QUESTIONS[step].options.map((option) => {
            const selected = preferences.experiencePreferences.includes(option.code);
            return (
              <Pressable
                key={option.code}
                onPress={() => toggle('experiencePreferences', option.code)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                style={{
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? colors.primary : colors.line,
                  backgroundColor: selected ? '#EFF9FB' : '#FFFFFF',
                }}
                className="w-[48.5%] items-center rounded-2xl px-2 py-4"
              >
                <View
                  className={`h-12 w-12 items-center justify-center rounded-full ${selected ? 'bg-[#D3EFF2]' : 'bg-[#F1F4F6]'}`}
                >
                  <Text className="text-[24px]">{option.emoji}</Text>
                </View>
                <Text className="mt-2 text-center text-[13px] font-bold text-[#13364A]">
                  {option.label}
                </Text>
                {selected ? (
                  <View className="absolute right-2 top-2">
                    <Icon name="check-circle" size={18} color={colors.primary} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View className="gap-2.5">
          {specialNeeds.map((item) => {
            const selected = preferences.specialNeeds.includes(item.code);
            return (
              <Pressable
                key={item.code}
                onPress={() => toggle('specialNeeds', item.code)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                style={{
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? colors.primary : colors.line,
                  backgroundColor: selected ? '#EFF9FB' : '#FFFFFF',
                }}
                className="flex-row items-center rounded-2xl px-4 py-3.5"
              >
                <View
                  className={`h-10 w-10 items-center justify-center rounded-full ${selected ? 'bg-[#D3EFF2]' : 'bg-[#F4F6F8]'}`}
                >
                  <Icon
                    name={SPECIAL_NEED_ICONS[item.code] ?? 'info'}
                    size={21}
                    color={colors.primary}
                  />
                </View>
                <Text className="ml-3 flex-1 text-[14px] font-semibold text-[#13364A]">
                  {item.name}
                </Text>
                <View
                  style={{
                    borderWidth: selected ? 0 : 1.5,
                    borderColor: '#C5CDD3',
                    backgroundColor: selected ? colors.primary : 'transparent',
                  }}
                  className="h-5 w-5 items-center justify-center rounded-md"
                >
                  {selected ? <Icon name="check" size={15} color="#FFFFFF" /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {error ? (
        <View className="mt-3">
          <Notice tone="danger">{error}</Notice>
        </View>
      ) : null}
      {done ? (
        <View className="mt-3">
          <Notice tone="success">
            Đã lưu sở thích. SmartTravel sẽ gợi ý điểm đến và lịch trình phù hợp hơn với bạn.
          </Notice>
        </View>
      ) : null}
    </Screen>
  );
}
