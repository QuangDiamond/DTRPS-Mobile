import React, { useMemo, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  companionOptions,
  paceOptions,
  planBudgetOptions,
  planDestinations,
  planInterestOptions,
  type BudgetId,
  type CompanionId,
  type PaceId,
} from '../../constants/planTrip';
import type { TravelPreferences } from '../../constants/travelPreferences';

// ==================== TYPES ====================

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export type TripPlan = {
  destinationId: string;
  startDate: Date;
  days: number;
  companion: CompanionId;
  members: number;
  budget: BudgetId;
  interests: string[];
  pace: PaceId;
};

type PlanTripScreenProps = {
  /** Sở thích đã lưu, dùng để điền sẵn ngân sách / sở thích / nhịp độ */
  preferences?: TravelPreferences;
  onBack: () => void;
  onSubmit?: (plan: TripPlan) => void;
};

// ==================== COLORS ====================

const COLORS = {
  primary: '#087A78',
  primaryDark: '#075C66',
  text: '#13364A',
  muted: '#72818C',
  background: '#F8F8FF',
  lightPurple: '#EBEDFF',
  mint: '#C3F8F0',
  selectedBg: '#E2FAF5',
  white: '#FFFFFF',
};

// ==================== HELPERS ====================

const pad = (value: number) => String(value).padStart(2, '0');

const formatDate = (date: Date) =>
  `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

// Chuyển sở thích đã lưu (UC-006) sang lựa chọn của màn này
const fromPreferences = (preferences?: TravelPreferences) => {
  const interestMap: Record<string, string> = {
    nature: 'nature',
    culture: 'culture',
    food: 'food',
    shopping: 'shopping',
    nightlife: 'shopping',
  };
  const budgetMap: Record<string, BudgetId> = {
    saving: 'saving',
    medium: 'standard',
    luxury: 'luxury',
  };
  const paceMap: Record<string, PaceId> = {
    relax: 'relaxed',
    luxury: 'relaxed',
    family: 'relaxed',
    adventure: 'packed',
  };

  const interests = Array.from(
    new Set((preferences?.interests ?? []).map((id) => interestMap[id]).filter(Boolean))
  );
  if (preferences?.style === 'adventure') interests.push('adventure');
  if (preferences?.style === 'relax') interests.push('relax');

  return {
    interests: interests.length > 0 ? interests : ['beach', 'food', 'culture'],
    budget: (preferences?.budget && budgetMap[preferences.budget]) || 'standard',
    pace: (preferences?.style && paceMap[preferences.style]) || 'balanced',
  };
};

// ==================== SMALL COMPONENTS ====================

function SectionCard({
  icon,
  title,
  subtitle,
  right,
  children,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-3.5 rounded-[20px] bg-white p-4">
      <View className="mb-3 flex-row items-center">
        <View
          className="h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: COLORS.lightPurple }}
        >
          <MaterialCommunityIcons name={icon} size={19} color={COLORS.primary} />
        </View>
        <View className="ml-2.5 min-w-0 flex-1">
          <Text className="text-[14px] font-extrabold" style={{ color: COLORS.text }}>
            {title}
          </Text>
          <Text className="text-[11px]" style={{ color: COLORS.muted }}>
            {subtitle}
          </Text>
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

function StepperButton({
  icon,
  onPress,
  disabled,
  filled,
}: {
  icon: IconName;
  onPress: () => void;
  disabled?: boolean;
  filled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      className="h-8 w-8 items-center justify-center rounded-full"
      style={{
        backgroundColor: filled ? COLORS.primaryDark : COLORS.lightPurple,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <MaterialCommunityIcons
        name={icon}
        size={18}
        color={filled ? 'white' : COLORS.primaryDark}
      />
    </Pressable>
  );
}

// ==================== MAIN SCREEN ====================

export default function PlanTripScreen({
  preferences,
  onBack,
  onSubmit,
}: PlanTripScreenProps) {
  const initial = useMemo(() => fromPreferences(preferences), [preferences]);

  const [destinationId, setDestinationId] = useState(planDestinations[0].id);
  const [showDestinations, setShowDestinations] = useState(false);

  const [startDate, setStartDate] = useState(() => addDays(new Date(), 7));
  const [days, setDays] = useState(4);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [companion, setCompanion] = useState<CompanionId>('couple');
  const [members, setMembers] = useState(2);

  const [budget, setBudget] = useState<BudgetId>(initial.budget);
  const [interests, setInterests] = useState<string[]>(initial.interests);
  const [pace, setPace] = useState<PaceId>(initial.pace);

  const destination = planDestinations.find((item) => item.id === destinationId)!;
  const endDate = addDays(startDate, days - 1);
  const budgetOption = planBudgetOptions.find((item) => item.id === budget)!;
  const today = new Date();

  const showComingSoon = (title: string) => {
    Alert.alert(title, 'Chức năng đang được phát triển.');
  };

  const selectCompanion = (id: CompanionId) => {
    setCompanion(id);
    setMembers(companionOptions.find((item) => item.id === id)!.defaultCount);
  };

  const changeMembers = (delta: number) => {
    const next = Math.min(20, Math.max(1, members + delta));
    setMembers(next);
    // Tự đổi kiểu đoàn khi số người không còn khớp
    if (next === 1) setCompanion('solo');
    else if (companion === 'solo') setCompanion(next === 2 ? 'couple' : 'friends');
  };

  const toggleInterest = (id: string) => {
    setInterests((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]
    );
  };

  const handleSubmit = () => {
    if (interests.length === 0) {
      Alert.alert('Thiếu sở thích', 'Hãy chọn ít nhất một sở thích trải nghiệm.');
      return;
    }

    const plan: TripPlan = {
      destinationId,
      startDate,
      days,
      companion,
      members,
      budget,
      interests,
      pace,
    };

    if (onSubmit) {
      onSubmit(plan);
      return;
    }

    Alert.alert(
      'Đang tạo lịch trình',
      `${destination.short} • ${days} ngày ${days - 1} đêm • ${members} người\n` +
        'SmartTravel AI đang sắp xếp lịch trình phù hợp cho bạn.',
      [{ text: 'OK', onPress: onBack }]
    );
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      className="flex-1"
      style={{ backgroundColor: COLORS.background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* ================= HEADER ================= */}

      <View className="h-[58px] flex-row items-center justify-between bg-white px-3">
        <View className="min-w-0 flex-1 flex-row items-center">
          <Pressable
            onPress={onBack}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center"
            accessibilityLabel="Quay lại"
          >
            <MaterialCommunityIcons name="chevron-left" size={27} color={COLORS.text} />
          </Pressable>
          <Text
            numberOfLines={1}
            className="ml-1 flex-1 text-[16px] font-bold"
            style={{ color: COLORS.text }}
          >
            Lập kế hoạch chuyến đi
          </Text>
        </View>

        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => showComingSoon('Chia sẻ')} hitSlop={6}>
            <MaterialCommunityIcons name="share-variant-outline" size={20} color={COLORS.muted} />
          </Pressable>
          <Pressable onPress={() => showComingSoon('Lưu bản nháp')} hitSlop={6}>
            <MaterialCommunityIcons name="bookmark-outline" size={21} color={COLORS.muted} />
          </Pressable>
          <View
            className="h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: COLORS.primaryDark }}
          >
            <MaterialCommunityIcons name="account" size={19} color="white" />
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 14, paddingBottom: 20 }}
      >
        {/* ================= INTRO ================= */}

        <View
          className="flex-row items-center self-start rounded-full px-2.5 py-1"
          style={{ backgroundColor: COLORS.mint }}
        >
          <MaterialCommunityIcons name="star-four-points" size={11} color={COLORS.primaryDark} />
          <Text className="ml-1 text-[10px] font-bold" style={{ color: COLORS.primaryDark }}>
            Smart AI Itinerary Engine
          </Text>
        </View>
        <Text className="mt-2 text-[20px] font-extrabold" style={{ color: COLORS.text }}>
          Tạo lịch trình du lịch cá nhân hóa
        </Text>
        <Text className="mt-1 text-[12px]" style={{ color: COLORS.muted }}>
          Tùy biến hành trình khám phá Việt Nam theo phong cách của bạn
        </Text>

        {/* ================= 1. DESTINATION ================= */}

        <SectionCard
          icon="map-marker-outline"
          title="Điểm đến mơ ước"
          subtitle="Chọn thành phố hoặc khu vực du lịch"
        >
          <Pressable
            onPress={() => setShowDestinations((previous) => !previous)}
            className="h-12 flex-row items-center rounded-2xl px-3.5"
            style={{ backgroundColor: COLORS.background, borderWidth: 1, borderColor: '#E3E7F0' }}
          >
            <MaterialCommunityIcons name="navigation-variant-outline" size={18} color={COLORS.primary} />
            <Text
              numberOfLines={1}
              className="ml-2 flex-1 text-[14px] font-bold"
              style={{ color: COLORS.text }}
            >
              {destination.label}
            </Text>
            <MaterialCommunityIcons
              name={showDestinations ? 'chevron-up' : 'chevron-down'}
              size={22}
              color={COLORS.muted}
            />
          </Pressable>

          {showDestinations && (
            <View className="mt-2 overflow-hidden rounded-2xl" style={{ borderWidth: 1, borderColor: '#E3E7F0' }}>
              {planDestinations.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    setDestinationId(item.id);
                    setShowDestinations(false);
                  }}
                  className="flex-row items-center px-3.5 py-3"
                  style={{
                    backgroundColor: item.id === destinationId ? COLORS.selectedBg : COLORS.white,
                  }}
                >
                  <Text className="flex-1 text-[13px]" style={{ color: COLORS.text }}>
                    {item.label}
                  </Text>
                  {item.id === destinationId && (
                    <MaterialCommunityIcons name="check" size={18} color={COLORS.primary} />
                  )}
                </Pressable>
              ))}
            </View>
          )}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-2.5"
            contentContainerStyle={{ gap: 6 }}
          >
            {planDestinations.map((item) => {
              const selected = item.id === destinationId;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setDestinationId(item.id)}
                  className="rounded-full px-3 py-1.5"
                  style={{ backgroundColor: selected ? COLORS.mint : COLORS.lightPurple }}
                >
                  <Text
                    className="text-[11px] font-semibold"
                    style={{ color: selected ? COLORS.primaryDark : '#445577' }}
                  >
                    {item.short}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </SectionCard>

        {/* ================= 2. DATES ================= */}

        <SectionCard
          icon="calendar-month-outline"
          title="Thời gian chuyến đi"
          subtitle="Chọn ngày bắt đầu và kết thúc"
        >
          <Pressable
            onPress={() => setShowDatePicker((previous) => !previous)}
            className="flex-row items-center rounded-2xl px-3.5 py-2.5"
            style={{ backgroundColor: COLORS.background, borderWidth: 1, borderColor: '#E3E7F0' }}
          >
            <View className="flex-1">
              <Text className="text-[15px] font-extrabold" style={{ color: COLORS.text }}>
                {formatDate(startDate)} - {formatDate(endDate)}
              </Text>
              <Text className="text-[11px] font-semibold" style={{ color: COLORS.primary }}>
                {days} ngày {days - 1} đêm
              </Text>
            </View>
            <MaterialCommunityIcons
              name={showDatePicker ? 'chevron-up' : 'calendar-edit'}
              size={21}
              color={COLORS.primary}
            />
          </Pressable>

          {showDatePicker && (
            <View className="mt-2 rounded-2xl p-3" style={{ backgroundColor: COLORS.background }}>
              <View className="flex-row items-center justify-between">
                <Text className="text-[12px] font-semibold" style={{ color: COLORS.muted }}>
                  Ngày đi
                </Text>
                <View className="flex-row items-center gap-2.5">
                  <StepperButton
                    icon="chevron-left"
                    disabled={addDays(startDate, -1) < today}
                    onPress={() => setStartDate(addDays(startDate, -1))}
                  />
                  <Text className="w-[86px] text-center text-[13px] font-bold" style={{ color: COLORS.text }}>
                    {formatDate(startDate)}
                  </Text>
                  <StepperButton icon="chevron-right" onPress={() => setStartDate(addDays(startDate, 1))} />
                </View>
              </View>

              <View className="mt-2.5 flex-row items-center justify-between">
                <Text className="text-[12px] font-semibold" style={{ color: COLORS.muted }}>
                  Số ngày
                </Text>
                <View className="flex-row items-center gap-2.5">
                  <StepperButton icon="minus" disabled={days <= 1} onPress={() => setDays(days - 1)} />
                  <Text className="w-[86px] text-center text-[13px] font-bold" style={{ color: COLORS.text }}>
                    {days} ngày
                  </Text>
                  <StepperButton icon="plus" disabled={days >= 14} onPress={() => setDays(days + 1)} />
                </View>
              </View>
            </View>
          )}
        </SectionCard>

        {/* ================= 3. COMPANIONS ================= */}

        <SectionCard
          icon="account-group-outline"
          title="Bạn đồng hành"
          subtitle="Số lượng và kiểu nhóm du lịch"
        >
          <View className="flex-row flex-wrap justify-between">
            {companionOptions.map((item) => {
              const selected = item.id === companion;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => selectCompanion(item.id)}
                  className="mb-2 flex-row items-center rounded-2xl px-3 py-2.5"
                  style={{
                    width: '48.5%',
                    backgroundColor: selected ? COLORS.selectedBg : COLORS.background,
                    borderWidth: selected ? 1.5 : 1,
                    borderColor: selected ? COLORS.primary : '#E3E7F0',
                  }}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={19}
                    color={selected ? COLORS.primaryDark : COLORS.muted}
                  />
                  <View className="ml-2">
                    <Text className="text-[12px] font-bold" style={{ color: COLORS.text }}>
                      {item.label}
                    </Text>
                    <Text className="text-[10px]" style={{ color: COLORS.muted }}>
                      {item.note}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View className="mt-1 flex-row items-center justify-between">
            <Text className="text-[12px] font-semibold" style={{ color: COLORS.muted }}>
              Tùy chỉnh thành viên:
            </Text>
            <View className="flex-row items-center gap-3">
              <StepperButton icon="minus" disabled={members <= 1} onPress={() => changeMembers(-1)} />
              <Text className="w-6 text-center text-[15px] font-extrabold" style={{ color: COLORS.text }}>
                {members}
              </Text>
              <StepperButton icon="plus" filled disabled={members >= 20} onPress={() => changeMembers(1)} />
            </View>
          </View>
        </SectionCard>

        {/* ================= 4. BUDGET ================= */}

        <SectionCard
          icon="wallet-outline"
          title="Ngân sách dự kiến"
          subtitle="Mức chi tiêu trung bình / người"
          right={
            <Text className="text-[15px] font-extrabold" style={{ color: COLORS.primary }}>
              {budgetOption.estimate}
            </Text>
          }
        >
          <View className="flex-row rounded-2xl p-1" style={{ backgroundColor: COLORS.lightPurple }}>
            {planBudgetOptions.map((item) => {
              const selected = item.id === budget;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setBudget(item.id)}
                  className="flex-1 items-center rounded-xl py-2"
                  style={{ backgroundColor: selected ? COLORS.mint : 'transparent' }}
                >
                  <Text
                    className="text-[12px] font-bold"
                    style={{ color: selected ? COLORS.primaryDark : COLORS.text }}
                  >
                    {item.label}
                  </Text>
                  <Text className="text-[10px]" style={{ color: COLORS.muted }}>
                    {item.note}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        {/* ================= 5. INTERESTS ================= */}

        <SectionCard
          icon="heart-multiple-outline"
          title="Sở thích trải nghiệm"
          subtitle="Chọn nhiều phong cách bạn yêu thích"
        >
          <View className="flex-row flex-wrap gap-2">
            {planInterestOptions.map((item) => {
              const selected = interests.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => toggleInterest(item.id)}
                  className="flex-row items-center rounded-full px-3 py-2"
                  style={{
                    backgroundColor: selected ? COLORS.mint : COLORS.background,
                    borderWidth: 1,
                    borderColor: selected ? COLORS.primary : '#E3E7F0',
                  }}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={15}
                    color={selected ? COLORS.primaryDark : COLORS.muted}
                  />
                  <Text
                    className="ml-1.5 text-[12px] font-semibold"
                    style={{ color: selected ? COLORS.primaryDark : COLORS.text }}
                  >
                    {item.label}
                  </Text>
                  {selected && (
                    <MaterialCommunityIcons
                      name="check-circle-outline"
                      size={14}
                      color={COLORS.primaryDark}
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        {/* ================= 6. PACE ================= */}

        <SectionCard
          icon="speedometer"
          title="Nhịp độ chuyến đi (Travel Pace)"
          subtitle="Tần suất và mật độ hoạt động"
        >
          {paceOptions.map((item) => {
            const selected = item.id === pace;
            return (
              <Pressable
                key={item.id}
                onPress={() => setPace(item.id)}
                className="mb-2 flex-row items-start rounded-2xl p-3"
                style={{
                  backgroundColor: selected ? COLORS.selectedBg : COLORS.background,
                  borderWidth: selected ? 1.5 : 1,
                  borderColor: selected ? COLORS.primary : '#E3E7F0',
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
              >
                <View
                  className="mr-2.5 mt-0.5 h-5 w-5 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: selected ? COLORS.primary : 'transparent',
                    borderWidth: selected ? 0 : 1.5,
                    borderColor: '#C5CDD3',
                  }}
                >
                  {selected && <MaterialCommunityIcons name="check" size={14} color="white" />}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="flex-1 text-[13px] font-bold" style={{ color: COLORS.text }}>
                      {item.label} ({item.english})
                    </Text>
                    <Text className="text-[10px] font-semibold" style={{ color: COLORS.primary }}>
                      {item.perDay}
                    </Text>
                  </View>
                  <Text className="mt-0.5 text-[11px]" style={{ color: COLORS.muted }}>
                    {item.description}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </SectionCard>

        {/* ================= PREVIEW ================= */}

        <ImageBackground
          source={{ uri: destination.image }}
          style={{ height: 130, marginTop: 14 }}
          imageStyle={{ borderRadius: 20 }}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
            style={{ flex: 1, borderRadius: 20, padding: 14, justifyContent: 'flex-end' }}
          >
            <Text className="text-[10px] font-semibold" style={{ color: COLORS.mint }}>
              Điểm nổi bật tại {destination.short}
            </Text>
            <Text className="mt-0.5 text-[15px] font-extrabold text-white">
              {destination.highlights}
            </Text>
          </LinearGradient>
        </ImageBackground>
      </ScrollView>

      {/* ================= FOOTER ================= */}

      <View className="bg-white px-4 pb-3 pt-2.5">
        <View className="mb-2 flex-row items-center justify-center">
          <MaterialCommunityIcons name="lightning-bolt" size={13} color="#E0A100" />
          <Text className="ml-1 text-[11px]" style={{ color: COLORS.muted }}>
            Tối ưu hóa lịch trình thông minh trong vài giây bởi AI
          </Text>
        </View>
        <Pressable
          onPress={handleSubmit}
          className="h-12 flex-row items-center justify-center rounded-full active:opacity-80"
          style={{ backgroundColor: COLORS.primaryDark }}
        >
          <Text className="text-[14px] font-bold text-white">Tạo chuyến đi của tôi</Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={18}
            color="white"
            style={{ marginLeft: 6 }}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
