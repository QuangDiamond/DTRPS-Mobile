import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../../ui/Typography';
import { errorMessage } from '../../api/http';
import { referenceApi } from '../../api/referenceApi';
import { tripFlowApi, type TravelPace } from '../../api/tripFlowApi';
import type { CategoryGroup, ReferenceItem } from '../../api/types';
import { userApi } from '../../api/userApi';
import {
  BudgetInput,
  MAX_BUDGET,
  PacePicker,
  ProvinceSheet,
  SectionCard,
  SelectBox,
  Stepper,
} from '../../components/PlanForm';
import {
  COMPANION_OPTIONS,
  EXPERIENCE_QUESTIONS,
  EXPERIENCE_TO_CATEGORIES,
  type CompanionId,
  type PaceId,
} from '../../data/planTrip';
import type { RootScreenProps } from '../../navigation/types';
import { colors } from '../../theme';
import { FlowProgress } from '../../ui/Bits';
import { Button } from '../../ui/Button';
import { DatePickerSheet } from '../../ui/DatePickerSheet';
import { Icon } from '../../ui/Icon';
import { Header, Screen } from '../../ui/Screen';
import { Notice } from '../../ui/States';
import { addDays, formatDate, todayIso } from '../../utils/format';

const DEFAULT_BUDGET = 10_000_000;
const PACE_TO_API: Record<PaceId, TravelPace> = { relaxed: 'RELAXED', balanced: 'BALANCED', packed: 'PACKED' };

/**
 * Tạo Travel Plan — giống PlanTripPage của web: chọn tỉnh, ngày, người đi cùng, ngân sách, nhịp độ.
 * Loại hình lấy từ Sở thích du lịch đã lưu (không hỏi lại), rồi chuyển sang màn Đang chuẩn bị.
 */
export default function PlanTripScreen({ navigation }: RootScreenProps<'PlanTrip'>) {
  const [provinces, setProvinces] = useState<ReferenceItem[]>([]);
  const [provincesFailed, setProvincesFailed] = useState(false);
  const [destination, setDestination] = useState<ReferenceItem | null>(null);
  const [pickingProvince, setPickingProvince] = useState(false);
  const [startDate, setStartDate] = useState(() => addDays(todayIso(), 7));
  const [pickingDate, setPickingDate] = useState(false);
  const [days, setDays] = useState(4);
  const [companion, setCompanion] = useState<CompanionId>('couple');
  const [members, setMembers] = useState(2);
  const [budgetInput, setBudgetInput] = useState(String(DEFAULT_BUDGET));
  const [typeGroups, setTypeGroups] = useState<CategoryGroup[]>([]);
  const [savedCategoryCodes, setSavedCategoryCodes] = useState<string[]>([]);
  const [savedExperiences, setSavedExperiences] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesFailed, setCategoriesFailed] = useState(false);
  const [pace, setPace] = useState<PaceId>('balanced');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reloadPrefs, setReloadPrefs] = useState(0);

  useEffect(() => {
    referenceApi.provinces().then(setProvinces).catch(() => setProvincesFailed(true));
  }, []);

  // Tải lại khi quay về từ màn Sở thích du lịch
  useEffect(() => navigation.addListener('focus', () => setReloadPrefs((n) => n + 1)), [navigation]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([referenceApi.categories(), userApi.preferences()]).then(([groupsResult, prefsResult]) => {
      if (!active) return;
      setCategoriesLoading(false);
      if (groupsResult.status === 'rejected') {
        setCategoriesFailed(true);
        return;
      }
      const groups = groupsResult.value;
      setTypeGroups(groups);
      if (prefsResult.status !== 'fulfilled') return;
      const valid = new Set(groups.flatMap((group) => group.subtypes.map((s) => s.code)));
      setSavedCategoryCodes([...new Set(prefsResult.value.interests.filter((code) => valid.has(code)))]);
      setSavedExperiences(prefsResult.value.experiencePreferences);
    });
    return () => {
      active = false;
    };
  }, [reloadPrefs]);

  const budget = Math.min(MAX_BUDGET, Math.max(0, Number(budgetInput) || 0));
  const endDate = addDays(startDate, days - 1);
  const experienceSet = new Set(savedExperiences);
  const selectedExperienceOptions = EXPERIENCE_QUESTIONS.flatMap((question) => [...question.options]).filter(
    (option) => experienceSet.has(option.code),
  );

  const selectCompanion = (id: CompanionId) => {
    setCompanion(id);
    setMembers(COMPANION_OPTIONS.find((item) => item.id === id)?.defaultCount ?? 2);
  };

  const changeMembers = (next: number) => {
    setMembers(next);
    if (next === 1) setCompanion('solo');
    else if (companion === 'solo') setCompanion(next === 2 ? 'couple' : 'friends');
  };

  const submit = async () => {
    if (submitting) return;
    setError(null);
    if (!destination) return setError('Hãy chọn điểm đến.');
    if (startDate < todayIso()) return setError('Ngày bắt đầu không thể ở trong quá khứ.');
    if (budget <= 0 || budget > MAX_BUDGET) return setError('Ngân sách phải lớn hơn 0 và không vượt quá 1 tỷ đồng.');
    if (categoriesLoading || categoriesFailed || typeGroups.length === 0) {
      return setError('Không tải được danh mục trải nghiệm.');
    }

    // Có trả lời câu "trải nghiệm" ở Sở thích → dùng mã tương ứng; chưa trả lời → loại hình đã lưu
    const hasActivityChoice = savedExperiences.some((code) => code.startsWith('EXPERIENCE_'));
    const compatible = new Set(
      hasActivityChoice ? savedExperiences.flatMap((code) => EXPERIENCE_TO_CATEGORIES[code] ?? []) : savedCategoryCodes,
    );
    const categoryCodes = [
      ...new Set(typeGroups.flatMap((group) => group.subtypes.filter((s) => compatible.has(s.code)).map((s) => s.code))),
    ].slice(0, 50);

    setSubmitting(true);
    try {
      const companionLabel = COMPANION_OPTIONS.find((item) => item.id === companion)?.label;
      const saved = await tripFlowApi.createPlan({
        title: `Du lịch ${destination.name} ${days} ngày`,
        destination: destination.name,
        startDate,
        endDate,
        budget,
        currency: 'VND',
        groupSize: members,
        // Backend đọc hình thức đồng hành từ mô tả này (giống web)
        description: companionLabel ? `Hình thức đồng hành: ${companionLabel}` : null,
        categoryCodes,
        experiencePreferences: savedExperiences,
        travelPace: PACE_TO_API[pace],
      });
      navigation.replace('GeneratingTrip', { planId: saved.planId });
    } catch (caught) {
      setError(errorMessage(caught));
      setSubmitting(false);
    }
  };

  return (
    <Screen
      header={
        <View className="bg-white">
          <Header title="Lập kế hoạch chuyến đi" onBack={() => navigation.goBack()} />
          <FlowProgress current={1} />
        </View>
      }
      footer={
        <View className="border-t border-[#E5F1F4] bg-white px-4 pb-4 pt-3">
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <Button title="Gợi ý địa điểm với AI" icon="auto-awesome" loading={submitting} onPress={() => void submit()} />
        </View>
      }
    >
      <View className="mb-4">
        <View className="flex-row items-center gap-1 self-start rounded-full bg-[#C0F5FB] px-2.5 py-1">
          <Icon name="auto-awesome" size={12} color={colors.primaryStrong} />
          <Text className="text-[10.5px] font-bold text-[#0E7490]">Smart Travel</Text>
        </View>
        <Text className="mt-2 text-[20px] font-extrabold text-[#13364A]">Tạo lịch trình du lịch cá nhân hóa</Text>
        <Text className="mt-1 text-[12.5px] text-[#72818C]">Chọn điểm đến, ngân sách và sở thích để bắt đầu hành trình.</Text>
      </View>

      <SectionCard icon="location-on" title="Điểm đến mơ ước" subtitle="Chọn tỉnh/thành du lịch">
        <SelectBox
          icon="near-me"
          value={destination?.name ?? null}
          placeholder={provincesFailed ? 'Không tải được danh sách tỉnh/thành' : 'Chọn tỉnh/thành'}
          onPress={() => setPickingProvince(true)}
          disabled={provinces.length === 0}
        />
      </SectionCard>

      <SectionCard icon="calendar-month" title="Thời gian chuyến đi" subtitle="Chọn ngày bắt đầu và số ngày">
        <SelectBox icon="event" value={`Bắt đầu: ${formatDate(startDate)}`} placeholder="" onPress={() => setPickingDate(true)} />
        <View className="mt-3 flex-row items-center justify-between">
          <View>
            <Text className="text-[12.5px] font-semibold text-[#72818C]">Số ngày</Text>
            <Text className="text-[11.5px] text-[#8193A0]">
              {formatDate(startDate)} → {formatDate(endDate)}
            </Text>
          </View>
          <Stepper value={days} onChange={setDays} min={1} max={30} label="số ngày" suffix="ngày" />
        </View>
      </SectionCard>

      <SectionCard
        icon="group"
        title="Bạn đồng hành"
        subtitle="Số lượng và kiểu nhóm du lịch"
        right={<Stepper value={members} onChange={changeMembers} min={1} max={20} label="số người" />}
      >
        <View className="flex-row flex-wrap justify-between gap-y-2">
          {COMPANION_OPTIONS.map((item) => {
            const active = item.id === companion;
            return (
              <Pressable
                key={item.id}
                onPress={() => selectCompanion(item.id)}
                style={{ borderColor: active ? colors.primary : colors.line, backgroundColor: active ? colors.primarySoft : '#FFFFFF' }}
                className="w-[48.5%] flex-row items-center gap-2 rounded-2xl border p-3"
              >
                <Icon name={item.icon} size={20} color={active ? colors.primary : colors.muted} />
                <View className="min-w-0 flex-1">
                  <Text className="text-[13px] font-bold text-[#13364A]">{item.label}</Text>
                  <Text className="text-[11px] text-[#72818C]">{item.note}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </SectionCard>

      <SectionCard icon="account-balance-wallet" title="Ngân sách dự kiến" subtitle="Tổng ngân sách cho cả chuyến đi">
        <BudgetInput value={budgetInput} onChange={setBudgetInput} />
      </SectionCard>

      <SectionCard
        icon="auto-awesome"
        title="Cá nhân hóa chuyến đi của bạn"
        subtitle="Dựa trên sở thích bạn đã thiết lập — dùng cho mọi chuyến đi mới."
      >
        {selectedExperienceOptions.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {selectedExperienceOptions.map((option) => (
              <View key={option.code} className="flex-row items-center gap-1 rounded-full bg-[#ECFEFF] px-3 py-1.5">
                <Text className="text-[12px]">{option.emoji}</Text>
                <Text className="text-[12px] font-bold text-[#0E7490]">{option.label}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-[12.5px] leading-5 text-[#72818C]">
            {categoriesLoading ? 'Đang tải sở thích…' : 'Bạn chưa thiết lập sở thích. Thiết lập để AI gợi ý đúng gu hơn.'}
          </Text>
        )}
        <Pressable onPress={() => navigation.navigate('Preferences')} className="mt-3 flex-row items-center gap-1 self-start">
          <Icon name="edit" size={15} color={colors.primary} />
          <Text className="text-[12.5px] font-bold text-[#0891B2]">Chỉnh sửa sở thích</Text>
        </Pressable>
      </SectionCard>

      <SectionCard icon="speed" title="Nhịp độ chuyến đi" subtitle="Tần suất và mật độ hoạt động">
        <PacePicker value={pace} onChange={setPace} />
      </SectionCard>

      <ProvinceSheet
        visible={pickingProvince}
        provinces={provinces}
        selected={destination?.name ?? null}
        onClose={() => setPickingProvince(false)}
        onSelect={(item) => {
          setDestination(item);
          setError(null);
        }}
      />
      <DatePickerSheet
        visible={pickingDate}
        title="Ngày bắt đầu"
        value={startDate}
        min={todayIso()}
        onClose={() => setPickingDate(false)}
        onSelect={setStartDate}
      />
    </Screen>
  );
}
