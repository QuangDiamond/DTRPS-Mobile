import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../../ui/Typography';
import { ClientApiError, errorMessage } from '../../api/http';
import { referenceApi } from '../../api/referenceApi';
import { tripFlowApi, type TravelPace, type TravelPlanResponse } from '../../api/tripFlowApi';
import type { CategoryGroup, ReferenceItem } from '../../api/types';
import {
  BudgetInput,
  PacePicker,
  ProvinceSheet,
  SectionCard,
  SelectBox,
  Stepper,
} from '../../components/PlanForm';
import type { PaceId } from '../../data/planTrip';
import type { RootScreenProps } from '../../navigation/types';
import { colors } from '../../theme';
import { Chip } from '../../ui/Bits';
import { Button } from '../../ui/Button';
import { DatePickerSheet } from '../../ui/DatePickerSheet';
import { Field } from '../../ui/Field';
import { Header, Screen } from '../../ui/Screen';
import { ErrorState, Notice } from '../../ui/States';
import { ListCardSkeleton } from '../../ui/Motion';
import { formatDate } from '../../utils/format';
import { canEditPlan, planStatusInfo } from '../../utils/planStatus';

const PACE_FROM_API: Record<TravelPace, PaceId> = {
  RELAXED: 'relaxed',
  BALANCED: 'balanced',
  PACKED: 'packed',
};
const PACE_TO_API: Record<PaceId, TravelPace> = {
  relaxed: 'RELAXED',
  balanced: 'BALANCED',
  packed: 'PACKED',
};

interface Loaded {
  plan: TravelPlanResponse;
  provinces: ReferenceItem[];
  groups: CategoryGroup[];
  hasItinerary: boolean;
}

/** Kế hoạch đã có lịch trình chưa (404 = chưa có) */
async function hasActiveItinerary(planId: number): Promise<boolean> {
  try {
    await tripFlowApi.activeItinerary(planId);
    return true;
  } catch (caught) {
    if (caught instanceof ClientApiError && caught.status === 404) return false;
    throw caught;
  }
}

/** Sửa kế hoạch du lịch: PUT /travel-plans/{planId} — giống EditTripPlanPage của web */
export default function EditPlanScreen({ navigation, route }: RootScreenProps<'EditPlan'>) {
  const { planId } = route.params;
  const [data, setData] = useState<Loaded | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [groupSize, setGroupSize] = useState(1);
  const [pace, setPace] = useState<PaceId>('balanced');
  const [categoryCodes, setCategoryCodes] = useState<string[]>([]);
  const [picking, setPicking] = useState<'province' | 'start' | 'end' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadError(null);
    Promise.all([
      tripFlowApi.plan(planId),
      referenceApi.provinces(),
      referenceApi.categories(),
      hasActiveItinerary(planId),
    ])
      .then(([plan, provinces, groups, hasItinerary]) => {
        if (!active) return;
        setData({ plan, provinces, groups, hasItinerary });
        setTitle(plan.title);
        setDescription(plan.description ?? '');
        setDestination(plan.destination);
        setStartDate(plan.startDate);
        setEndDate(plan.endDate);
        setBudget(
          plan.budget === null || plan.budget === undefined ? '' : String(Math.round(plan.budget)),
        );
        setGroupSize(plan.groupSize);
        setPace(PACE_FROM_API[plan.travelPace] ?? 'balanced');
        setCategoryCodes(plan.categoryCodes ?? []);
      })
      .catch((caught: unknown) => active && setLoadError(errorMessage(caught)));
    return () => {
      active = false;
    };
  }, [planId, retry]);

  const header = (
    <Header title="Sửa kế hoạch" subtitle={data?.plan.title} onBack={() => navigation.goBack()} />
  );

  if (loadError) {
    return (
      <Screen header={header}>
        <ErrorState message={loadError} onRetry={() => setRetry((n) => n + 1)} />
      </Screen>
    );
  }
  if (!data) {
    return (
      <Screen header={header}>
        <ListCardSkeleton count={4} />
      </Screen>
    );
  }

  const { plan, provinces, groups, hasItinerary } = data;
  if (!canEditPlan(plan)) {
    return (
      <Screen header={header}>
        <Notice
          tone="warning"
          title={`Kế hoạch đang ở trạng thái “${planStatusInfo(plan.status).label}” nên không sửa được.`}
        >
          Chỉ sửa được kế hoạch ở trạng thái Bản nháp hoặc Đã lên kế hoạch.
        </Notice>
      </Screen>
    );
  }

  const toggleCode = (code: string) =>
    setCategoryCodes((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code],
    );

  const submit = async () => {
    if (saving) return;
    setError(null);
    const trimmed = title.trim();
    if (!trimmed) return setError('Hãy nhập tên kế hoạch.');
    if (trimmed.length > 255) return setError('Tên kế hoạch tối đa 255 ký tự.');
    if (!destination) return setError('Hãy chọn điểm đến.');
    if (!startDate || !endDate) return setError('Hãy chọn ngày đi và ngày về.');
    if (endDate < startDate) return setError('Ngày về phải bằng hoặc sau ngày đi.');
    const budgetValue = budget.trim() === '' ? null : Number(budget);
    if (budgetValue !== null && (!Number.isFinite(budgetValue) || budgetValue < 0))
      return setError('Ngân sách phải là số không âm.');
    if (categoryCodes.length > 50) return setError('Hãy chọn tối đa 50 loại hình trải nghiệm.');

    setSaving(true);
    try {
      await tripFlowApi.updatePlan(plan.planId, {
        title: trimmed,
        destination,
        startDate,
        endDate,
        budget: budgetValue,
        currency: plan.currency || 'VND',
        groupSize,
        description: description.trim() || null,
        categoryCodes,
        // Giữ nguyên câu trả lời cá nhân hóa đã lưu trên kế hoạch
        experiencePreferences: plan.experiencePreferences,
        travelPace: PACE_TO_API[pace],
      });
      navigation.goBack();
    } catch (caught) {
      setError(errorMessage(caught));
      setSaving(false);
    }
  };

  return (
    <Screen
      header={header}
      footer={
        <View className="border-t border-[#E5F1F4] bg-white px-4 pb-4 pt-3">
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <Button
            title="Lưu kế hoạch"
            icon="check"
            loading={saving}
            onPress={() => void submit()}
          />
        </View>
      }
    >
      {hasItinerary ? (
        <Notice tone="warning">
          Kế hoạch đã có lịch trình nên không đổi được điểm đến, ngày đi và ngày về. Các thông tin
          khác vẫn sửa được.
        </Notice>
      ) : null}

      <SectionCard icon="edit" title="Thông tin chung" subtitle="Tên và mô tả kế hoạch">
        <Field label="Tên kế hoạch" value={title} onChangeText={setTitle} maxLength={255} />
        <Field
          label="Mô tả"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={1000}
        />
      </SectionCard>

      <SectionCard icon="location-on" title="Điểm đến & thời gian">
        <SelectBox
          icon="near-me"
          value={destination || null}
          placeholder="Chọn tỉnh/thành"
          disabled={hasItinerary}
          onPress={() => setPicking('province')}
        />
        <View className="mt-3 flex-row gap-2.5">
          <View className="flex-1">
            <Text className="mb-1 text-[12px] font-semibold text-[#72818C]">Ngày đi</Text>
            <SelectBox
              icon="event"
              value={formatDate(startDate)}
              placeholder=""
              disabled={hasItinerary}
              onPress={() => setPicking('start')}
            />
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-[12px] font-semibold text-[#72818C]">Ngày về</Text>
            <SelectBox
              icon="event"
              value={formatDate(endDate)}
              placeholder=""
              disabled={hasItinerary}
              onPress={() => setPicking('end')}
            />
          </View>
        </View>
      </SectionCard>

      <SectionCard
        icon="groups"
        title="Số người & ngân sách"
        subtitle="Ngân sách cho cả nhóm"
        right={
          <Stepper value={groupSize} onChange={setGroupSize} min={1} max={50} label="số người" />
        }
      >
        <BudgetInput value={budget} onChange={setBudget} />
      </SectionCard>

      <SectionCard icon="speed" title="Nhịp độ chuyến đi" subtitle="Tần suất và mật độ hoạt động">
        <PacePicker value={pace} onChange={setPace} />
      </SectionCard>

      <SectionCard
        icon="category"
        title="Loại hình trải nghiệm"
        subtitle="Dùng để gợi ý địa điểm cho chuyến đi"
        right={
          categoryCodes.length > 0 ? (
            <Pressable onPress={() => setCategoryCodes([])} hitSlop={6}>
              <Text className="text-[12px] font-bold text-[#0891B2]">Bỏ chọn</Text>
            </Pressable>
          ) : undefined
        }
      >
        {groups.length === 0 ? (
          <Text className="text-[12.5px] text-[#72818C]">Hiện chưa có danh mục trải nghiệm.</Text>
        ) : (
          groups.map((group) => (
            <View key={group.code} className="mb-3">
              <Text className="mb-1.5 text-[12px] font-bold" style={{ color: colors.muted }}>
                {group.name}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {group.subtypes.map((type) => (
                  <Chip
                    key={type.code}
                    label={type.name}
                    selected={categoryCodes.includes(type.code)}
                    onPress={() => toggleCode(type.code)}
                  />
                ))}
              </View>
            </View>
          ))
        )}
      </SectionCard>

      <ProvinceSheet
        visible={picking === 'province'}
        provinces={provinces}
        selected={destination}
        onClose={() => setPicking(null)}
        onSelect={(item) => setDestination(item.name)}
      />
      <DatePickerSheet
        visible={picking === 'start'}
        title="Ngày đi"
        value={startDate}
        onClose={() => setPicking(null)}
        onSelect={(iso) => {
          setStartDate(iso);
          if (endDate < iso) setEndDate(iso);
        }}
      />
      <DatePickerSheet
        visible={picking === 'end'}
        title="Ngày về"
        value={endDate}
        min={startDate}
        onClose={() => setPicking(null)}
        onSelect={setEndDate}
      />
    </Screen>
  );
}
