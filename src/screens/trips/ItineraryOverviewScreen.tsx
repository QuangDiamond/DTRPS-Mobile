import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../../ui/Typography';
import { ClientApiError, errorMessage } from '../../api/http';
import {
  tripFlowApi,
  type ItineraryActivity,
  type ItineraryOverview,
  type ItineraryOverviewDay,
  type PlanStatus,
  type TripFeedbackResponse,
} from '../../api/tripFlowApi';
import { useAuth } from '../../auth/AuthProvider';
import EditActivitySheet, { type EditMode } from '../../components/EditActivitySheet';
import TripFeedbackSheet from '../../components/TripFeedbackSheet';
import WeatherForecastStrip from '../../components/WeatherForecastStrip';
import type { RootScreenProps } from '../../navigation/types';
import { colors, shadow } from '../../theme';
import { Avatar, Stars } from '../../ui/Bits';
import { Button } from '../../ui/Button';
import { Icon, type IconName } from '../../ui/Icon';
import { Header, Screen } from '../../ui/Screen';
import { EmptyState, Notice } from '../../ui/States';
import { ListCardSkeleton } from '../../ui/Motion';
import { formatDate, formatNumber, formatTime } from '../../utils/format';
import { PLAN_STATUS_INFO } from '../../utils/planStatus';

const FEEDBACK_PROMPT_DELAY_MS = 1_000;

const money = (value: number | null | undefined, currency: string) =>
  value === null || value === undefined ? 'Chưa ước tính' : `${formatNumber(value)} ${currency}`;

function SummaryCard({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View className="w-[48.5%] flex-row items-start gap-2.5 rounded-2xl border border-[#E2EAEA] bg-white p-3.5">
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#E9F5F7]">
        <Icon name={icon} size={19} color={colors.primary} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[11px] text-[#61757A]">{label}</Text>
        <Text className="text-[14px] font-extrabold text-[#122E40]">{value}</Text>
      </View>
    </View>
  );
}

function BudgetCard({
  total,
  budget,
  currency,
}: {
  total: number;
  budget: number | null | undefined;
  currency: string;
}) {
  const difference = budget == null ? null : budget - total;
  const percent = budget != null && budget > 0 ? (total / budget) * 100 : null;
  const over = difference != null && difference < 0;
  return (
    <View style={shadow.card} className="mt-4 rounded-3xl bg-white p-4">
      <View className="flex-row items-center gap-2">
        <Icon name="account-balance-wallet" size={21} color={colors.primary} />
        <Text className="text-[15px] font-extrabold text-[#163142]">Ngân sách chuyến đi</Text>
      </View>
      <Text className="mt-3 text-[11.5px] text-[#61757A]">Tổng chi phí dự kiến</Text>
      <Text className="text-[22px] font-extrabold text-[#122E40]">{money(total, currency)}</Text>
      <View className="mt-2 flex-row justify-between">
        <Text className="text-[12px] text-[#61757A]">Ngân sách kế hoạch</Text>
        <Text className="text-[12px] font-bold text-[#163142]">{money(budget, currency)}</Text>
      </View>
      {percent !== null ? (
        <View className="mt-2.5">
          <View className="h-2 overflow-hidden rounded-full bg-[#E6EEF0]">
            <View
              style={{
                width: `${Math.min(100, Math.max(0, percent))}%`,
                height: '100%',
                backgroundColor: over ? '#C66B42' : colors.primary,
              }}
            />
          </View>
          <Text className="mt-1.5 text-[11.5px] text-[#61757A]">
            {Math.round(percent)}% ngân sách dự kiến
          </Text>
        </View>
      ) : null}
      {difference !== null ? (
        <View className={`mt-3 rounded-2xl p-3 ${over ? 'bg-[#FFF1EB]' : 'bg-[#ECF7F9]'}`}>
          <Text
            className={`text-[11.5px] font-semibold ${over ? 'text-[#9A472D]' : 'text-[#0E7490]'}`}
          >
            {over ? 'Vượt ngân sách dự kiến' : 'Còn lại so với ngân sách'}
          </Text>
          <Text
            className={`text-[17px] font-extrabold ${over ? 'text-[#9A472D]' : 'text-[#0E7490]'}`}
          >
            {money(Math.abs(difference), currency)}
          </Text>
        </View>
      ) : null}
      <Text className="mt-3 text-[11px] leading-[17px] text-[#61757A]">
        Chi phí chỉ là ước tính; có thể chưa bao gồm lưu trú, ăn uống, đi lại và các dịch vụ chưa có
        giá.
      </Text>
    </View>
  );
}

function DayCard({
  day,
  currency,
  onOpen,
  onEdit,
}: {
  day: ItineraryOverviewDay;
  currency: string;
  onOpen: () => void;
  onEdit?: (activity: ItineraryActivity, mode: EditMode) => void;
}) {
  const activities = [...day.activities].sort((a, b) => a.itemOrder - b.itemOrder);
  return (
    <View style={shadow.card} className="overflow-hidden rounded-3xl bg-white">
      <View className="flex-row items-center gap-3 border-b border-[#E9EFEF] p-4">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#0E7490] px-3 py-1.5">
          <Text className="text-[8.5px] font-semibold uppercase tracking-[1.5px] text-[#C0EAEF]">
            Ngày
          </Text>
          <Text className="text-[19px] font-extrabold leading-6 text-white">
            {String(day.dayNumber).padStart(2, '0')}
          </Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="text-[15.5px] font-extrabold text-[#163142]">
            {day.title || `Ngày ${day.dayNumber}`}
          </Text>
          <Text className="text-[11.5px] text-[#61757A]">
            {formatDate(day.visitDate)} · {activities.length} hoạt động
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-[10.5px] text-[#61757A]">Chi phí</Text>
          <Text className="text-[12.5px] font-extrabold text-[#0891B2]">
            {money(day.estimatedCost, currency)}
          </Text>
        </View>
      </View>
      {day.notes ? (
        <Text className="mx-4 mt-3 rounded-xl bg-[#F5F8F8] p-3 text-[11.5px] leading-5 text-[#506775]">
          {day.notes}
        </Text>
      ) : null}

      {activities.length === 0 ? (
        <View className="items-center px-5 py-8">
          <Icon name="event-available" size={32} color="#8BB2B6" />
          <Text className="mt-1 text-[13px] font-bold text-[#163142]">Chưa có hoạt động</Text>
          <Text className="text-[11.5px] text-[#61757A]">Ngày này chưa được sắp xếp địa điểm.</Text>
        </View>
      ) : (
        <View className="p-4">
          {activities.map((activity, index) => (
            <View key={activity.itemId} className="flex-row gap-3 pb-4">
              <View className="items-center">
                <View className="h-8 w-8 items-center justify-center rounded-full border border-[#CCE4E6] bg-[#ECF7F9]">
                  <Text className="text-[12px] font-extrabold text-[#0891B2]">{index + 1}</Text>
                </View>
                {index < activities.length - 1 ? (
                  <View className="mt-1 w-0.5 flex-1 bg-[#DCEBEC]" />
                ) : null}
              </View>
              <View className="min-w-0 flex-1">
                {activity.travelTimeMinutes != null && activity.travelTimeMinutes > 0 ? (
                  <View className="mb-1.5 flex-row items-center gap-1">
                    <Icon name="directions-car" size={15} color={colors.primary} />
                    <Text className="text-[11px] text-[#61757A]">
                      Di chuyển ước tính · {activity.travelTimeMinutes} phút
                      {activity.transportModeName ? ` · ${activity.transportModeName}` : ''}
                    </Text>
                  </View>
                ) : null}
                <View className="rounded-2xl border border-[#E5EDED] bg-[#FCFDFD] p-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1 rounded-lg bg-[#E8F4F6] px-2 py-1">
                      <Icon name="schedule" size={14} color={colors.primaryStrong} />
                      <Text className="text-[11.5px] font-bold text-[#0E7490]">
                        {formatTime(activity.startTime)} – {formatTime(activity.endTime)}
                      </Text>
                    </View>
                    <Text className="text-[11.5px] font-bold text-[#163142]">
                      {money(activity.estimatedCost, currency)}
                    </Text>
                  </View>
                  <Text className="mt-2 text-[14.5px] font-extrabold leading-5 text-[#163142]">
                    {activity.placeName}
                  </Text>
                  {activity.placeAddress ? (
                    <Text
                      numberOfLines={2}
                      className="mt-1 text-[11.5px] leading-[17px] text-[#61757A]"
                    >
                      {activity.placeAddress}
                    </Text>
                  ) : null}
                  {activity.notes ? (
                    <Text className="mt-2 rounded-lg bg-[#F0F5F5] p-2.5 text-[11.5px] leading-[17px] text-[#506775]">
                      {activity.notes}
                    </Text>
                  ) : null}
                  {onEdit && activity.status === 'PLANNED' ? (
                    <View className="mt-3 flex-row flex-wrap gap-2 border-t border-[#E5EDED] pt-2.5">
                      {(
                        [
                          { mode: 'time', icon: 'schedule', label: 'Đổi giờ' },
                          { mode: 'replace', icon: 'edit-location-alt', label: 'Thay địa điểm' },
                          { mode: 'swap', icon: 'swap-horiz', label: 'Hoán đổi' },
                        ] as const
                      ).map((action) => (
                        <Pressable
                          key={action.mode}
                          onPress={() => onEdit(activity, action.mode)}
                          className="flex-row items-center gap-1 rounded-lg border border-[#DCE9E5] bg-white px-2.5 py-1.5"
                        >
                          <Icon name={action.icon} size={15} color="#086B60" />
                          <Text className="text-[11px] font-semibold text-[#086B60]">
                            {action.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
      <View className="border-t border-[#E9EFED] p-3">
        <Pressable
          onPress={onOpen}
          className="flex-row items-center justify-between rounded-xl bg-[#F0F7F4] px-4 py-3"
        >
          <View className="flex-row items-center gap-2">
            <Icon name="map" size={18} color="#086B60" />
            <Text className="text-[13px] font-bold text-[#086B60]">
              Xem chi tiết ngày {day.dayNumber}
            </Text>
          </View>
          <Icon name="arrow-forward" size={18} color="#086B60" />
        </Pressable>
      </View>
    </View>
  );
}

/** Tổng quan lịch trình — giống ItineraryOverviewPage của web */
export default function ItineraryOverviewScreen({
  navigation,
  route,
}: RootScreenProps<'Itinerary'>) {
  const { planId } = route.params;
  const { user } = useAuth();
  const [creationWarnings, setCreationWarnings] = useState<string[]>(route.params.warnings ?? []);
  const [overview, setOverview] = useState<ItineraryOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [planStatus, setPlanStatus] = useState<PlanStatus | null>(null);
  const [editTarget, setEditTarget] = useState<{
    day: ItineraryOverviewDay;
    activity: ItineraryActivity;
    mode: EditMode;
  } | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [tripFeedback, setTripFeedback] = useState<TripFeedbackResponse | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      let timer: ReturnType<typeof setTimeout> | undefined;
      setError(null);
      setNotFound(false);
      Promise.all([tripFlowApi.overview(planId), tripFlowApi.plan(planId)])
        .then(async ([data, plan]) => {
          if (!active) return;
          setOverview(data);
          setPlanStatus(plan.status);
          // Đánh giá chuyến đi: chỉ khi COMPLETED và chưa đánh giá (mỗi khách 1 lần/kế hoạch)
          const feedback = await tripFlowApi.feedback(planId).catch((caught: unknown) => {
            if (caught instanceof ClientApiError && caught.status === 404) return null;
            throw caught;
          });
          if (!active) return;
          setTripFeedback(feedback);
          if (!feedback && plan.status === 'COMPLETED') {
            timer = setTimeout(() => active && setShowFeedback(true), FEEDBACK_PROMPT_DELAY_MS);
          }
        })
        .catch((caught: unknown) => {
          if (!active) return;
          if (caught instanceof ClientApiError && caught.status === 404) setNotFound(true);
          else setError(errorMessage(caught));
        })
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
        if (timer) clearTimeout(timer);
      };
    }, [planId, retryCount]),
  );

  const days = useMemo(
    () => [...(overview?.days ?? [])].sort((a, b) => a.dayNumber - b.dayNumber),
    [overview],
  );
  const totalActivities = days.reduce((sum, day) => sum + day.activities.length, 0);
  const canEdit =
    (planStatus === 'DRAFT' || planStatus === 'PLANNED') && overview?.status === 'ACTIVE';
  const currency = overview?.currency ?? 'VND';

  const header = (
    <Header
      title="Lịch trình của bạn"
      subtitle={overview?.destination}
      onBack={() => navigation.goBack()}
      right={
        <Pressable
          onPress={() => navigation.navigate('Tabs', { screen: 'Trips' })}
          className="rounded-full bg-[#ECFEFF] px-3 py-2"
        >
          <Text className="text-[11.5px] font-bold text-[#0E7490]">Chuyến đi</Text>
        </Pressable>
      }
    />
  );

  if (loading && !overview) {
    return (
      <Screen header={header}>
        <ListCardSkeleton count={4} />
      </Screen>
    );
  }

  if (error || notFound || !overview) {
    return (
      <Screen header={header}>
        <EmptyState
          icon="event-note"
          title={notFound ? 'Chưa tìm thấy lịch trình đã tạo' : 'Không thể tải lịch trình'}
          message={
            notFound
              ? 'Kế hoạch này chưa có lịch trình đang dùng. Hãy kiểm tra địa điểm đã chọn và tạo lịch trình.'
              : (error ?? undefined)
          }
          action={
            <View className="gap-2.5">
              <Button
                title="Thử tải lại"
                variant="outline"
                onPress={() => setRetryCount((n) => n + 1)}
              />
              <Button
                title="Xem địa điểm đã chọn"
                onPress={() => navigation.navigate('SelectedPlaces', { planId })}
              />
            </View>
          }
        />
      </Screen>
    );
  }

  return (
    <Screen header={header} refreshing={false} onRefresh={() => setRetryCount((n) => n + 1)}>
      {creationWarnings.length > 0 ? (
        <View className="mb-3 flex-row gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <Icon name="warning" size={20} color="#D97706" />
          <View className="min-w-0 flex-1">
            <Text className="text-[12.5px] font-extrabold text-amber-900">
              Lịch trình đã được tạo, nhưng có vài điểm cần lưu ý
            </Text>
            {creationWarnings.map((warning, index) => (
              <Text key={index} className="mt-1 text-[12px] leading-[18px] text-amber-900">
                {warning}
              </Text>
            ))}
          </View>
          <Pressable
            onPress={() => setCreationWarnings([])}
            hitSlop={8}
            accessibilityLabel="Đóng cảnh báo"
          >
            <Icon name="close" size={18} color="#92400E" />
          </Pressable>
        </View>
      ) : null}

      <View className="overflow-hidden rounded-[26px] bg-[#12344A] p-5">
        <View className="flex-row items-center gap-1.5">
          <Icon name="route" size={18} color="#BCE6EB" />
          <Text className="text-[11px] font-semibold tracking-[1.2px] text-[#BCE6EB]">
            HÀNH TRÌNH CỦA BẠN
          </Text>
        </View>
        <Text className="mt-2 text-[23px] font-extrabold leading-7 text-white">
          {overview.itineraryTitle}
        </Text>
        <View className="mt-3 gap-1">
          <View className="flex-row items-center gap-1.5">
            <Icon name="location-on" size={16} color="#DFF2F4" />
            <Text className="text-[13px] text-[#DFF2F4]">{overview.destination}</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Icon name="calendar-month" size={16} color="#DFF2F4" />
            <Text className="text-[13px] text-[#DFF2F4]">
              {formatDate(overview.startDate)} – {formatDate(overview.endDate)}
            </Text>
          </View>
        </View>
        {overview.itineraryNotes ? (
          <Text className="mt-3 text-[12.5px] leading-5 text-[#D4EDEF]">
            {overview.itineraryNotes}
          </Text>
        ) : null}
        <View className="mt-4 flex-row items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5">
          <View className="flex-row items-center gap-1.5">
            <Icon name="event-available" size={17} color="#D3EDF0" />
            <Text className="text-[12px] font-semibold text-[#D3EDF0]">
              {planStatus ? PLAN_STATUS_INFO[planStatus].label : 'Lịch trình của bạn'}
            </Text>
          </View>
          <Text className="text-[11.5px] text-[#C1E6EA]">Phiên bản {overview.versionNumber}</Text>
        </View>
      </View>

      <WeatherForecastStrip itineraryId={overview.itineraryId} />

      <View className="mt-4 flex-row flex-wrap justify-between gap-y-2.5">
        <SummaryCard icon="calendar-month" label="Thời lượng" value={`${days.length} ngày`} />
        <SummaryCard icon="place" label="Hoạt động" value={`${totalActivities} địa điểm`} />
        <SummaryCard
          icon="account-balance-wallet"
          label="Chi phí dự kiến"
          value={money(overview.totalEstimatedCost, currency)}
        />
        <SummaryCard icon="savings" label="Ngân sách" value={money(overview.budget, currency)} />
      </View>

      <BudgetCard
        total={overview.totalEstimatedCost}
        budget={overview.budget}
        currency={currency}
      />

      <View className="mb-3 mt-6 flex-row items-end justify-between">
        <View className="min-w-0 flex-1">
          <Text className="text-[19px] font-extrabold text-[#163142]">Lịch trình từng ngày</Text>
          <Text className="text-[12px] text-[#61757A]">
            {canEdit
              ? 'Tùy chỉnh từng điểm dừng theo cách của bạn.'
              : 'Theo dõi các điểm dừng trong hành trình.'}
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('SelectedPlaces', { planId })}
          className="flex-row items-center gap-1 rounded-xl border border-[#DCE8E6] bg-white px-2.5 py-2"
        >
          <Icon name="format-list-bulleted" size={16} color="#086B60" />
          <Text className="text-[11.5px] font-bold text-[#086B60]">Đã chọn</Text>
        </Pressable>
      </View>

      {savedNotice ? <Notice tone="success">Đã lưu thay đổi lịch trình.</Notice> : null}

      {days.length === 0 ? (
        <View className="rounded-3xl bg-white p-8">
          <Text className="text-center text-[13px] text-[#61757A]">
            Lịch trình chưa có ngày hoặc hoạt động nào.
          </Text>
        </View>
      ) : (
        <View className="gap-4">
          {days.map((day) => (
            <View key={day.dayId}>
              <DayCard
                day={day}
                currency={currency}
                onOpen={() => navigation.navigate('ItineraryDay', { planId, day: day.dayNumber })}
                onEdit={
                  canEdit ? (activity, mode) => setEditTarget({ day, activity, mode }) : undefined
                }
              />
            </View>
          ))}
        </View>
      )}

      <View className="mt-4 flex-row gap-2.5 rounded-2xl border border-[#E2EAEA] bg-[#F5F9F9] p-3.5">
        <Icon name="info" size={19} color={colors.primary} />
        <Text className="flex-1 text-[11.5px] leading-[18px] text-[#61757A]">
          Lịch trình được sắp xếp bằng thuật toán, không phải AI. Thời gian di chuyển là ước lượng.{' '}
          {canEdit
            ? 'Bạn có thể đổi giờ, thay địa điểm hoặc hoán đổi các hoạt động trước khi khởi hành.'
            : 'Chỉnh sửa chỉ khả dụng trước khi chuyến đi bắt đầu.'}
        </Text>
      </View>

      {tripFeedback ? (
        <View style={shadow.card} className="mt-5 rounded-3xl bg-white p-4">
          <View className="flex-row items-center gap-2.5">
            <Avatar name={user?.name} url={user?.avatarUrl} size={36} />
            <Text numberOfLines={1} className="flex-1 text-[13px] font-extrabold text-[#13364A]">
              {user?.name ?? 'Bạn'}
            </Text>
            <Stars value={tripFeedback.rating} size={15} />
          </View>
          <View className="mt-2 flex-row items-center gap-1">
            <Icon name="verified" size={15} color={colors.primary} />
            <Text className="text-[12px] font-bold text-[#0891B2]">Đánh giá của bạn</Text>
          </View>
          {tripFeedback.comment ? (
            <Text className="mt-1.5 text-[12.5px] leading-5 text-[#506775]">
              “{tripFeedback.comment}”
            </Text>
          ) : null}
        </View>
      ) : planStatus === 'COMPLETED' ? (
        <Button
          title="Đánh giá chuyến đi"
          icon="star"
          variant="secondary"
          style={{ marginTop: 16 }}
          onPress={() => setShowFeedback(true)}
        />
      ) : null}

      <EditActivitySheet
        overview={overview}
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={() => {
          setEditTarget(null);
          setSavedNotice(true);
          setRetryCount((n) => n + 1);
        }}
      />
      <TripFeedbackSheet
        planId={planId}
        visible={showFeedback}
        onClose={() => setShowFeedback(false)}
        onSubmitted={(feedback) => setTripFeedback(feedback)}
      />
    </Screen>
  );
}
