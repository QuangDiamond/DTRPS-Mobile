import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, View } from 'react-native';
import { Text } from '../../ui/Typography';
import { errorMessage } from '../../api/http';
import {
  tripFlowApi,
  type AiRecommendationResponse,
  type TravelPlanResponse,
} from '../../api/tripFlowApi';
import type { RootScreenProps } from '../../navigation/types';
import { colors } from '../../theme';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { PulseRing } from '../../ui/Motion';
import { Screen } from '../../ui/Screen';
import { Notice } from '../../ui/States';

// Thời gian hiệu ứng (giống web) — KHÔNG phải thời gian xử lý của AI
const TOTAL_DURATION = 8000;
const STEPS = [
  { doing: 'Đang xác nhận kế hoạch chuyến đi', done: 'Đã xác nhận kế hoạch được lưu' },
  { doing: 'Đang đọc sở thích trải nghiệm của bạn', done: 'Đã tải sở thích trải nghiệm' },
  {
    doing: 'SmartTravel đang tìm và xếp hạng địa điểm phù hợp',
    done: 'SmartTravel đã xếp hạng các địa điểm',
  },
  { doing: 'Đang chuẩn bị màn hình lựa chọn địa điểm', done: 'Sẵn sàng để bạn chọn địa điểm' },
];
const easeOutQuad = (ratio: number) => 1 - (1 - ratio) * (1 - ratio);

function Globe({ finished, stopped }: { finished: boolean; stopped: boolean }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (stopped) return;
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin, stopped]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <View className="h-[210px] w-[210px] items-center justify-center self-center">
      {!stopped ? <PulseRing size={208} color="#0891B2" /> : null}
      <View className="absolute h-[200px] w-[200px] rounded-full border border-[#D7EFF1] bg-[#F2FAFB]" />
      <View className="absolute h-[160px] w-[160px] rounded-full border border-[#D7EFF1]" />
      {!stopped ? (
        <Animated.View
          style={{ position: 'absolute', width: 200, height: 200, transform: [{ rotate }] }}
        >
          <View className="absolute right-[18px] top-[18px] h-8 w-8 items-center justify-center rounded-full bg-white">
            <Icon
              name="flight"
              size={17}
              color={colors.primaryStrong}
              style={{ transform: [{ rotate: '45deg' }] }}
            />
          </View>
          <View className="absolute bottom-[30px] left-3 h-3 w-3 rounded-full border-2 border-white bg-[#0891B2]" />
        </Animated.View>
      ) : null}
      <View
        className="h-[118px] w-[118px] items-center justify-center rounded-full bg-white"
        style={{ elevation: 4 }}
      >
        <Icon name={finished ? 'verified' : 'public'} size={72} color={colors.primary} />
      </View>
    </View>
  );
}

/** Đang chuẩn bị danh sách địa điểm: xác nhận plan + gọi AI gợi ý (giống GeneratingTripPage của web) */
export default function GeneratingTripScreen({
  navigation,
  route,
}: RootScreenProps<'GeneratingTrip'>) {
  const { planId } = route.params;
  const [plan, setPlan] = useState<TravelPlanResponse | null>(null);
  const [planLoaded, setPlanLoaded] = useState(false);
  const [placesLoaded, setPlacesLoaded] = useState(false);
  const [recommendation, setRecommendation] = useState<AiRecommendationResponse | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (error) return;
    const startedAt = Date.now();
    setElapsed(0);
    const timer = setInterval(() => {
      const next = Math.min(TOTAL_DURATION, Date.now() - startedAt);
      setElapsed(next);
      if (next >= TOTAL_DURATION) clearInterval(timer);
    }, 100);
    return () => clearInterval(timer);
  }, [retryCount, error]);

  useEffect(() => {
    let active = true;
    setPlan(null);
    setPlanLoaded(false);
    setPlacesLoaded(false);
    setRecommendation(null);
    setError(null);
    (async () => {
      try {
        const savedPlan = await tripFlowApi.plan(planId);
        if (!active) return;
        setPlan(savedPlan);
        setPlanLoaded(true);
        const recommended = await tripFlowApi.recommendedPlaces(planId);
        if (!active) return;
        setRecommendation(recommended);
        setPlacesLoaded(true);
      } catch (caught) {
        if (active) setError(errorMessage(caught));
      }
    })();
    return () => {
      active = false;
    };
  }, [planId, retryCount]);

  const dataReady = planLoaded && placesLoaded && plan !== null;
  const finished = dataReady && elapsed >= TOTAL_DURATION;
  const ratio = Math.min(1, elapsed / TOTAL_DURATION);
  const percent = finished
    ? 100
    : dataReady
      ? Math.round(easeOutQuad(ratio) * 100)
      : Math.min(95, Math.round(easeOutQuad(ratio) * 100));
  const doneSteps = finished ? 4 : planLoaded ? (placesLoaded ? 3 : 2) : 0;
  const currentStep = Math.min(doneSteps, STEPS.length - 1);

  const back = () =>
    Alert.alert(
      'Quay lại trang chuyến đi?',
      'Kế hoạch đã được lưu. Quay lại sẽ không xóa kế hoạch này.',
      [
        { text: 'Ở lại', style: 'cancel' },
        { text: 'Quay lại', onPress: () => navigation.navigate('Tabs', { screen: 'Trips' }) },
      ],
    );

  return (
    <Screen>
      <View className="rounded-3xl bg-white px-5 pb-4 pt-6">
        <Globe finished={finished} stopped={finished || Boolean(error)} />
        <View className="mt-2 flex-row items-center gap-1 self-center rounded-full bg-[#ECFEFF] px-3 py-1">
          <Icon name="explore" size={14} color={colors.primaryStrong} />
          <Text className="text-[11px] font-semibold text-[#0E7490]">Hành trình cá nhân hóa</Text>
        </View>
        <Text className="mt-3 text-center text-[20px] font-extrabold leading-7 text-[#13364A]">
          {error
            ? 'Chưa thể chuẩn bị danh sách địa điểm'
            : finished
              ? 'Địa điểm cho chuyến đi đã sẵn sàng!'
              : 'Đang chuẩn bị hành trình hoàn hảo...'}
        </Text>
        <Text className="mt-2 text-center text-[12.5px] leading-5 text-[#72818C]">
          {plan ? (
            <>
              Đang chuẩn bị danh sách địa điểm phù hợp với sở thích của bạn tại{' '}
              <Text className="font-bold text-[#0891B2]">{plan.destination}</Text>.
            </>
          ) : (
            'Đang xác nhận thông tin chuyến đi đã lưu trên hệ thống.'
          )}
        </Text>

        <View className="mt-5 rounded-[20px] border border-[#ECEFF5] p-4">
          <View className="flex-row items-center gap-2">
            <Text className="flex-1 text-[14px] font-bold text-[#13364A]">
              Đang tổng hợp thông tin địa điểm
            </Text>
            <Text className="text-[11px] text-[#72818C]">
              ({doneSteps}/{STEPS.length})
            </Text>
            <Text className="text-[16px] font-extrabold text-[#0891B2]">{percent}%</Text>
          </View>
          <View className="mt-2.5 h-2 overflow-hidden rounded-full bg-[#E9EEF5]">
            <View
              style={{ width: `${percent}%`, height: '100%', backgroundColor: colors.primary }}
            />
          </View>
          <View className="mt-3 gap-2">
            {STEPS.map((step, index) => {
              const status =
                index < doneSteps ? 'done' : !error && index === currentStep ? 'doing' : 'waiting';
              return (
                <View
                  key={step.done}
                  className={`flex-row items-center gap-2.5 rounded-2xl px-3 py-2.5 ${
                    status === 'doing'
                      ? 'border border-[#9CDFE6] bg-[#E1F9FB]'
                      : status === 'done'
                        ? 'bg-[#F4F6FB]'
                        : ''
                  }`}
                >
                  <Icon
                    name={
                      status === 'done'
                        ? 'check-circle'
                        : status === 'doing'
                          ? 'autorenew'
                          : 'radio-button-unchecked'
                    }
                    size={18}
                    color={status === 'waiting' ? '#B9C6D0' : colors.primary}
                  />
                  <Text
                    className={`flex-1 text-[12.5px] ${status === 'waiting' ? 'text-[#9AA9B3]' : 'font-semibold text-[#13364A]'}`}
                  >
                    {status === 'done' ? step.done : step.doing}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {error ? (
          <View className="mt-4">
            <Notice tone="danger">{error}</Notice>
          </View>
        ) : null}

        <View className="mt-5 gap-2.5">
          {error ? (
            <Button title="Thử lại" icon="refresh" onPress={() => setRetryCount((n) => n + 1)} />
          ) : (
            <Button
              title={
                finished
                  ? `Xem ${recommendation?.items.length ?? 0} địa điểm gợi ý`
                  : 'Đang chuẩn bị...'
              }
              iconRight={finished ? 'arrow-forward' : undefined}
              disabled={!finished}
              onPress={() =>
                navigation.replace('Suggestions', {
                  planId,
                  recommendation: recommendation ?? undefined,
                })
              }
            />
          )}
          <Button title="Quay lại chuyến đi" variant="ghost" onPress={back} />
        </View>
      </View>
    </Screen>
  );
}
