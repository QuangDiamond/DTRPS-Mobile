import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Share, View } from 'react-native';
import { Text } from '../../ui/Typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClientApiError, errorMessage } from '../../api/http';
import { tripFlowApi, type PlanStatus, type TravelPlanResponse } from '../../api/tripFlowApi';
import { useAuth } from '../../auth/AuthProvider';
import { LoginRequired } from '../../components/LoginRequired';
import { useRootNav } from '../../navigation/hooks';
import { colors, shadow } from '../../theme';
import { Sheet } from '../../ui/Bits';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { EmptyState, ErrorState, Loading } from '../../ui/States';
import { Toast, useToast } from '../../ui/Toast';
import { countDays, formatDate, formatNumber } from '../../utils/format';
import {
  canDeletePlan,
  canEditPlan,
  isPlanFinished,
  PLAN_STATUS_ACTION,
  PLAN_STATUS_INFO,
  planStatusInfo,
} from '../../utils/planStatus';

type TripFilter = 'ongoing' | 'finished';
const FILTERS: { id: TripFilter; label: string }[] = [
  { id: 'ongoing', label: 'Chưa hoàn tất' },
  { id: 'finished', label: 'Đã kết thúc' },
];

const money = (amount: number | null, currency: string, empty: string) =>
  amount === null || amount === undefined ? empty : `${formatNumber(amount)} ${currency}`;

function TripCard({
  plan,
  busy,
  opening,
  onOpen,
  onMenu,
  onShare,
  onSelected,
  onSuggestions,
}: {
  plan: TravelPlanResponse;
  busy: boolean;
  opening: boolean;
  onOpen: () => void;
  onMenu: () => void;
  onShare: () => void;
  onSelected: () => void;
  onSuggestions: () => void;
}) {
  const status = planStatusInfo(plan.status);
  const hasMenu = canEditPlan(plan) || canDeletePlan(plan) || (plan.allowedNextStatuses ?? []).length > 0;
  return (
    <View style={shadow.card} className="rounded-[22px] bg-white p-2.5">
      <View className="h-[150px] justify-between overflow-hidden rounded-[18px] bg-[#0891B2] p-3">
        <View className="absolute -right-6 -top-8 opacity-15">
          <Icon name="travel-explore" size={170} color="#FFFFFF" />
        </View>
        <View className="flex-row items-start justify-between">
          <View style={{ backgroundColor: status.bg }} className="flex-row items-center gap-1 rounded-full px-2.5 py-1">
            <Icon name={status.icon} size={14} color={status.fg} />
            <Text style={{ color: status.fg }} className="text-[10.5px] font-bold">
              {status.label}
            </Text>
          </View>
          <View className="flex-row gap-1.5">
            <Pressable onPress={onShare} accessibilityLabel={`Chia sẻ ${plan.title}`} className="h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <Icon name="share" size={17} color="#FFFFFF" />
            </Pressable>
            {hasMenu ? (
              <Pressable onPress={onMenu} disabled={busy} accessibilityLabel={`Thao tác với ${plan.title}`} className="h-8 w-8 items-center justify-center rounded-full bg-white/20">
                {busy ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Icon name="more-vert" size={18} color="#FFFFFF" />}
              </Pressable>
            ) : null}
          </View>
        </View>
        <View>
          <Text numberOfLines={2} className="text-[17px] font-extrabold leading-6 text-white">
            {plan.title}
          </Text>
          <View className="mt-1 flex-row items-center gap-1">
            <Icon name="location-on" size={15} color="#FFFFFF" />
            <Text className="text-[11.5px] font-semibold text-white/90">
              {plan.destination} · {countDays(plan.startDate, plan.endDate)} ngày
            </Text>
          </View>
        </View>
      </View>

      <View className="px-1.5 pt-3">
        <View className="flex-row gap-2 rounded-2xl bg-[#F3F7FA] p-3">
          <View className="flex-1 flex-row items-start gap-2">
            <Icon name="date-range" size={18} color={colors.primary} />
            <View>
              <Text className="text-[10px] text-[#72818C]">Thời gian</Text>
              <Text className="text-[11.5px] font-bold text-[#13364A]">{formatDate(plan.startDate)}</Text>
              <Text className="text-[10px] text-[#72818C]">đến {formatDate(plan.endDate)}</Text>
            </View>
          </View>
          <View className="flex-1 flex-row items-start gap-2">
            <Icon name="groups" size={18} color={colors.primary} />
            <View>
              <Text className="text-[10px] text-[#72818C]">Số người</Text>
              <Text className="text-[12px] font-bold text-[#13364A]">{plan.groupSize} người</Text>
            </View>
          </View>
        </View>
        <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-1.5">
          <View className="flex-row items-center gap-1">
            <Icon name="payments" size={16} color={colors.primary} />
            <Text className="text-[12px] font-semibold text-[#13364A]">
              {money(plan.estimatedCost, plan.currency, 'Chưa có chi phí ước tính')}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Icon name="category" size={16} color={colors.primary} />
            <Text className="text-[11.5px] text-[#72818C]">{plan.categoryCodes?.length ?? 0} loại hình</Text>
          </View>
        </View>
        <View className="mb-1 mt-3.5 flex-row items-center gap-2">
          <Pressable
            onPress={onOpen}
            disabled={opening}
            className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-full bg-[#0E7490] px-3"
          >
            {opening ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Icon name="route" size={18} color="#FFFFFF" />}
            <Text className="text-[12.5px] font-bold text-white">{opening ? 'Đang kiểm tra...' : 'Mở chuyến đi'}</Text>
          </Pressable>
          <Pressable onPress={onSelected} accessibilityLabel={`Địa điểm đã chọn của ${plan.title}`} className="h-11 w-11 items-center justify-center rounded-full bg-[#ECFEFF]">
            <Icon name="shopping-basket" size={20} color={colors.primaryStrong} />
          </Pressable>
          <Pressable onPress={onSuggestions} accessibilityLabel={`Danh sách địa điểm cho ${plan.title}`} className="h-11 w-11 items-center justify-center rounded-full bg-[#ECFEFF]">
            <Icon name="add-location-alt" size={20} color={colors.primaryStrong} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/** Danh sách Travel Plan thật từ Backend — giống MyTripsPage của web */
export default function MyTripsScreen() {
  const { user } = useAuth();
  const navigation = useRootNav();
  const [toast, showToast] = useToast();
  const [plans, setPlans] = useState<TravelPlanResponse[]>([]);
  const [filter, setFilter] = useState<TripFilter>('ongoing');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [openingPlanId, setOpeningPlanId] = useState<number | null>(null);
  const [busyPlanId, setBusyPlanId] = useState<number | null>(null);
  const [menuPlan, setMenuPlan] = useState<TravelPlanResponse | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let active = true;
      setError(null);
      tripFlowApi
        .plans()
        .then((result) => active && setPlans(result))
        .catch((caught: unknown) => active && setError(errorMessage(caught)))
        .finally(() => {
          if (!active) return;
          setLoading(false);
          setRefreshing(false);
        });
      return () => {
        active = false;
      };
    }, [user, retryCount]),
  );

  if (!user) {
    return <LoginRequired title="Chuyến đi của bạn" message="Đăng nhập để tạo kế hoạch, nhận gợi ý AI và theo dõi lịch trình." />;
  }

  const counts: Record<TripFilter, number> = {
    ongoing: plans.filter((plan) => !isPlanFinished(plan)).length,
    finished: plans.filter(isPlanFinished).length,
  };
  const visiblePlans = plans.filter((plan) => (filter === 'finished' ? isPlanFinished(plan) : !isPlanFinished(plan)));

  // Backend không đổi status khi tạo itinerary → kiểm tra lịch trình đang dùng (giống web)
  const openPlan = async (plan: TravelPlanResponse) => {
    if (openingPlanId !== null) return;
    setOpeningPlanId(plan.planId);
    try {
      await tripFlowApi.activeItinerary(plan.planId);
      navigation.navigate('Itinerary', { planId: plan.planId });
    } catch (caught) {
      if (caught instanceof ClientApiError && caught.status === 404) {
        navigation.navigate('SelectedPlaces', { planId: plan.planId });
      } else {
        showToast(errorMessage(caught));
      }
    } finally {
      setOpeningPlanId(null);
    }
  };

  const changeStatus = (plan: TravelPlanResponse, status: PlanStatus) => {
    const action = PLAN_STATUS_ACTION[status];
    Alert.alert(action.label, action.confirm, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: action.label,
        style: action.danger ? 'destructive' : 'default',
        onPress: async () => {
          setBusyPlanId(plan.planId);
          try {
            const updated = await tripFlowApi.changeStatus(plan.planId, status);
            setPlans((current) => current.map((item) => (item.planId === updated.planId ? updated : item)));
            const label = PLAN_STATUS_INFO[updated.status]?.label ?? updated.status;
            showToast(
              isPlanFinished(updated)
                ? `Đã chuyển “${updated.title}” sang ${label}. Xem trong mục Đã kết thúc.`
                : `Đã chuyển “${updated.title}” sang ${label}.`,
            );
          } catch (caught) {
            showToast(errorMessage(caught));
          } finally {
            setBusyPlanId(null);
          }
        },
      },
    ]);
  };

  const deletePlan = (plan: TravelPlanResponse) =>
    Alert.alert('Xóa kế hoạch', `Xóa kế hoạch “${plan.title}”? Thao tác này không hoàn tác được.`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          setBusyPlanId(plan.planId);
          try {
            await tripFlowApi.deletePlan(plan.planId);
            setPlans((current) => current.filter((item) => item.planId !== plan.planId));
            showToast(`Đã xóa kế hoạch “${plan.title}”.`);
          } catch (caught) {
            showToast(errorMessage(caught));
          } finally {
            setBusyPlanId(null);
          }
        },
      },
    ]);

  const sharePlan = (plan: TravelPlanResponse) =>
    void Share.share({
      title: plan.title,
      message: [
        plan.title,
        `Điểm đến: ${plan.destination}`,
        `Thời gian: ${formatDate(plan.startDate)} - ${formatDate(plan.endDate)}`,
        `Số người: ${plan.groupSize}`,
        `Ngân sách: ${money(plan.budget, plan.currency, 'Chưa đặt ngân sách')}`,
      ].join('\n'),
    });

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={loading || error ? [] : visiblePlans}
        keyExtractor={(item) => String(item.planId)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 14 }}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          setRetryCount((n) => n + 1);
        }}
        ListHeaderComponent={
          <View>
            <View className="flex-row items-center gap-3">
              <View className="min-w-0 flex-1">
                <Text className="text-[22px] font-extrabold text-[#13364A]">Chuyến đi của tôi</Text>
                <Text className="text-[12px] text-[#72818C]">Các kế hoạch đã lưu trong tài khoản Smart Travel</Text>
              </View>
              <Pressable
                onPress={() => navigation.navigate('PlanTrip')}
                accessibilityLabel="Tạo chuyến đi mới"
                className="h-11 w-11 items-center justify-center rounded-full bg-[#0891B2]"
              >
                <Icon name="add" size={26} color="#FFFFFF" />
              </Pressable>
            </View>
            <View className="mt-4 flex-row rounded-2xl bg-[#EEF5F7] p-1">
              {FILTERS.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => setFilter(item.id)}
                  className={`flex-1 items-center rounded-xl py-2.5 ${filter === item.id ? 'bg-white' : ''}`}
                >
                  <Text className={`text-[13px] font-bold ${filter === item.id ? 'text-[#0E7490]' : 'text-[#72818C]'}`}>
                    {item.label} ({counts[item.id]})
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TripCard
            plan={item}
            busy={busyPlanId === item.planId}
            opening={openingPlanId === item.planId}
            onOpen={() => void openPlan(item)}
            onMenu={() => setMenuPlan(item)}
            onShare={() => sharePlan(item)}
            onSelected={() => navigation.navigate('SelectedPlaces', { planId: item.planId })}
            onSuggestions={() => navigation.navigate('Suggestions', { planId: item.planId })}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <Loading label="Đang tải chuyến đi…" />
          ) : error ? (
            <ErrorState message={error} onRetry={() => setRetryCount((n) => n + 1)} />
          ) : (
            <EmptyState
              icon="luggage"
              title={filter === 'finished' ? 'Chưa có chuyến đi nào kết thúc' : 'Chưa có kế hoạch nào'}
              message={filter === 'finished' ? undefined : 'Tạo kế hoạch đầu tiên, SmartTravel sẽ gợi ý địa điểm phù hợp cho bạn.'}
              action={filter === 'ongoing' ? <Button title="Tạo chuyến đi" icon="add" onPress={() => navigation.navigate('PlanTrip')} /> : undefined}
            />
          )
        }
      />

      <Sheet visible={menuPlan !== null} onClose={() => setMenuPlan(null)} title={menuPlan?.title ?? ''}>
        {menuPlan ? (
          <View className="gap-1 pb-2">
            {canEditPlan(menuPlan) ? (
              <Pressable
                onPress={() => {
                  const id = menuPlan.planId;
                  setMenuPlan(null);
                  navigation.navigate('EditPlan', { planId: id });
                }}
                className="flex-row items-center gap-3 rounded-xl px-2 py-3"
              >
                <Icon name="edit" size={20} color={colors.primary} />
                <Text className="text-[14px] font-semibold text-[#13364A]">Sửa kế hoạch</Text>
              </Pressable>
            ) : null}
            {(menuPlan.allowedNextStatuses ?? []).map((status) => {
              const action = PLAN_STATUS_ACTION[status];
              if (!action) return null;
              return (
                <Pressable
                  key={status}
                  onPress={() => {
                    const plan = menuPlan;
                    setMenuPlan(null);
                    changeStatus(plan, status);
                  }}
                  className="flex-row items-center gap-3 rounded-xl px-2 py-3"
                >
                  <Icon name={action.icon} size={20} color={action.danger ? '#AD3232' : colors.primary} />
                  <Text className={`text-[14px] font-semibold ${action.danger ? 'text-[#AD3232]' : 'text-[#13364A]'}`}>{action.label}</Text>
                </Pressable>
              );
            })}
            {canDeletePlan(menuPlan) ? (
              <Pressable
                onPress={() => {
                  const plan = menuPlan;
                  setMenuPlan(null);
                  deletePlan(plan);
                }}
                className="flex-row items-center gap-3 rounded-xl px-2 py-3"
              >
                <Icon name="delete-outline" size={20} color="#AD3232" />
                <Text className="text-[14px] font-semibold text-[#AD3232]">Xóa kế hoạch</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </Sheet>
      <Toast message={toast} />
    </SafeAreaView>
  );
}
