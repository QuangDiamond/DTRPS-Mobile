import { useEffect, useMemo, useState } from 'react';
import { Dimensions, Image, Linking, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../ui/Typography';
import { errorMessage } from '../../api/http';
import { placeReviewApi, type PlaceReview } from '../../api/placeReviewApi';
import { placesApi } from '../../api/placesApi';
import { tripFlowApi, type TravelPlanResponse } from '../../api/tripFlowApi';
import type { PlaceDetail } from '../../api/types';
import ImageViewer from '../../components/ImageViewer';
import PlacesMap from '../../components/PlacesMap';
import type { RootScreenProps } from '../../navigation/types';
import { colors } from '../../theme';
import { Avatar, Badge, Stars } from '../../ui/Bits';
import { Button } from '../../ui/Button';
import { Icon, type IconName } from '../../ui/Icon';
import { Header, Screen } from '../../ui/Screen';
import { ErrorState, Loading, Notice } from '../../ui/States';
import { PlaceDetailSkeleton } from '../../ui/Motion';
import { formatDate, PRICE_TYPE_LABEL, WEEKDAY_LABEL } from '../../utils/format';

type DetailTab = 'intro' | 'photos' | 'contact' | 'reviews';
const TABS: { id: DetailTab; label: string }[] = [
  { id: 'intro', label: 'Giới thiệu' },
  { id: 'photos', label: 'Ảnh' },
  { id: 'contact', label: 'Liên hệ' },
  { id: 'reviews', label: 'Đánh giá' },
];

const money = (amount: number) =>
  amount === 0 ? 'Miễn phí' : `${Math.round(amount).toLocaleString('vi-VN')}đ`;

function ContactRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: IconName;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center gap-3 border-b border-[#EEF1F4] py-3"
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#ECFEFF]">
        <Icon name={icon} size={18} color={colors.primary} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[11px] text-[#72818C]">{label}</Text>
        <Text
          className={`text-[13.5px] font-semibold ${onPress ? 'text-[#0891B2]' : 'text-[#13364A]'}`}
        >
          {value}
        </Text>
      </View>
    </Pressable>
  );
}

/** Chi tiết một địa điểm trong luồng chọn của kế hoạch — giống SuggestionDetailPage của web */
export default function SuggestionDetailScreen({
  navigation,
  route,
}: RootScreenProps<'SuggestionDetail'>) {
  const { planId, placeId } = route.params;
  const width = Dimensions.get('window').width - 32;
  const [plan, setPlan] = useState<TravelPlanResponse | null>(null);
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [inPlan, setInPlan] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [tab, setTab] = useState<DetailTab>('intro');
  const [imageIndex, setImageIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [reviews, setReviews] = useState<PlaceReview[] | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([
      tripFlowApi.plan(planId),
      placesApi.get(placeId),
      tripFlowApi.selectedPlaces(planId),
    ])
      .then(([savedPlan, detail, selected]) => {
        if (!active) return;
        setPlan(savedPlan);
        setPlace(detail);
        setInPlan(selected.places.some((item) => item.placeId === placeId));
        setSelectedCount(selected.count);
      })
      .catch((caught: unknown) => active && setError(errorMessage(caught)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [planId, placeId, retryCount]);

  useEffect(() => {
    if (tab !== 'reviews' || reviews !== null) return;
    placeReviewApi
      .list(placeId, 0, 10)
      .then((result) => setReviews(result.items))
      .catch(() => setReviews([]));
  }, [tab, reviews, placeId]);

  const photos = useMemo(() => {
    if (!place) return [] as string[];
    const links = [...place.images]
      .sort((a, b) => Number(b.primary) - Number(a.primary))
      .map((image) => image.url);
    if (place.summary.coverUrl) links.push(place.summary.coverUrl);
    return [...new Set(links.filter(Boolean))];
  }, [place]);

  const togglePlace = async () => {
    if (!place || busy) return;
    const next = !inPlan;
    setBusy(true);
    setActionError(null);
    try {
      if (next) await tripFlowApi.addPlace(planId, placeId);
      else await tripFlowApi.removePlace(planId, placeId);
      setInPlan(next);
      setSelectedCount((current) => Math.max(0, current + (next ? 1 : -1)));
    } catch (caught) {
      setActionError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const header = (
    <Header title="Chi tiết địa điểm" subtitle={plan?.title} onBack={() => navigation.goBack()} />
  );

  if (loading) {
    return (
      <Screen header={header}>
        <PlaceDetailSkeleton />
      </Screen>
    );
  }
  if (error || !place) {
    return (
      <Screen header={header}>
        <ErrorState
          message={error ?? 'Không tải được địa điểm.'}
          onRetry={() => setRetryCount((n) => n + 1)}
        />
      </Screen>
    );
  }

  const summary = place.summary;
  const openingHours = [...place.openingHours].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const minPrice = place.prices.length
    ? [...place.prices].sort((a, b) => a.amount - b.amount)[0]
    : null;

  return (
    <Screen
      header={header}
      footer={
        <View className="border-t border-[#EEF1F5] bg-white px-4 pb-4 pt-3">
          {actionError ? <Notice tone="danger">{actionError}</Notice> : null}
          <View className="flex-row gap-2.5">
            <View className="flex-1">
              <Button
                title={
                  busy
                    ? 'Đang cập nhật...'
                    : inPlan
                      ? 'Đã chọn · Bỏ khỏi kế hoạch'
                      : 'Thêm vào kế hoạch'
                }
                icon={inPlan ? 'check-circle' : 'add'}
                variant={inPlan ? 'secondary' : 'primary'}
                loading={busy}
                onPress={() => void togglePlace()}
              />
            </View>
            <Pressable
              onPress={() => navigation.navigate('SelectedPlaces', { planId })}
              className="h-12 flex-row items-center gap-1 rounded-full border border-[#DCECF0] bg-white px-4"
            >
              <Icon name="shopping-basket" size={18} color={colors.primaryStrong} />
              <Text className="text-[13px] font-bold text-[#0E7490]">{selectedCount}</Text>
            </Pressable>
          </View>
        </View>
      }
    >
      <View
        style={{ height: 230, borderRadius: 22, overflow: 'hidden', backgroundColor: '#CEE7EA' }}
      >
        {photos.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) =>
              setImageIndex(Math.round(event.nativeEvent.contentOffset.x / width))
            }
          >
            {photos.map((url, index) => (
              <Pressable key={url} onPress={() => setViewerIndex(index)}>
                <Image source={{ uri: url }} style={{ width, height: 230 }} />
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Icon name="landscape" size={48} color="#FFFFFF" />
          </View>
        )}
        {photos.length > 1 ? (
          <View className="absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1">
            <Text className="text-[11.5px] font-bold text-white">
              {imageIndex + 1} / {photos.length}
            </Text>
          </View>
        ) : null}
      </View>

      <Text className="mt-4 text-[22px] font-extrabold text-[#13364A]">{summary.name}</Text>
      <View className="mt-2 flex-row flex-wrap items-center gap-2">
        <Badge label={summary.category?.name ?? 'Địa điểm du lịch'} />
        <View className="flex-row items-center gap-1">
          <Icon name="star" size={15} color="#E0A100" />
          <Text className="text-[12.5px] font-bold text-[#13364A]">{summary.rating ?? 'Mới'}</Text>
          <Text className="text-[12px] text-[#72818C]">({summary.reviewCount})</Text>
        </View>
        <Text className="text-[12.5px] font-extrabold text-[#087A78]">
          {minPrice ? money(minPrice.amount) : 'Chưa có giá'}
        </Text>
      </View>
      <View className="mt-2 flex-row items-start gap-1">
        <Icon name="location-on" size={16} color={colors.muted} />
        <Text className="flex-1 text-[12.5px] text-[#557080]">
          {summary.address ?? 'Chưa cập nhật địa chỉ'}
        </Text>
      </View>

      <View className="mt-4 flex-row rounded-2xl bg-[#EEF5F7] p-1">
        {TABS.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setTab(item.id)}
            className={`flex-1 items-center rounded-xl py-2 ${tab === item.id ? 'bg-white' : ''}`}
          >
            <Text
              className={`text-[12.5px] font-bold ${tab === item.id ? 'text-[#0E7490]' : 'text-[#72818C]'}`}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="mt-3 rounded-2xl bg-white p-4">
        {tab === 'intro' ? (
          <View>
            <Text className="text-[13.5px] leading-[22px] text-[#3B4B57]">
              {place.description ?? 'Địa điểm này chưa có phần giới thiệu.'}
            </Text>
            {place.prices.length > 0 ? (
              <>
                <Text className="mb-1.5 mt-4 text-[14px] font-extrabold text-[#13364A]">
                  Giá tham khảo
                </Text>
                {place.prices.map((price, idx) => (
                  <View
                    key={`${price.priceType}-${idx}`}
                    className="flex-row justify-between py-1.5"
                  >
                    <Text className="flex-1 text-[12.5px] text-[#3B4B57]">
                      {price.description ?? PRICE_TYPE_LABEL[price.priceType] ?? 'Giá'}
                    </Text>
                    <Text className="text-[12.5px] font-extrabold text-[#0E7490]">
                      {money(price.amount)}
                    </Text>
                  </View>
                ))}
              </>
            ) : null}
            <Text className="mb-1.5 mt-4 text-[14px] font-extrabold text-[#13364A]">
              Giờ mở cửa
            </Text>
            {openingHours.length === 0 ? (
              <Text className="text-[12.5px] text-[#72818C]">Chưa cập nhật</Text>
            ) : (
              openingHours.map((hour) => (
                <View key={hour.dayOfWeek} className="flex-row justify-between py-1">
                  <Text className="text-[12.5px] text-[#3B4B57]">
                    {WEEKDAY_LABEL[hour.dayOfWeek]}
                  </Text>
                  <Text
                    className={`text-[12.5px] font-semibold ${hour.closed ? 'text-[#C2412D]' : 'text-[#13364A]'}`}
                  >
                    {hour.closed
                      ? 'Đóng cửa'
                      : `${hour.openTime ?? '--'} - ${hour.closeTime ?? '--'}`}
                  </Text>
                </View>
              ))
            )}
          </View>
        ) : null}

        {tab === 'photos' ? (
          <View className="flex-row flex-wrap justify-between gap-y-2">
            {photos.length === 0 ? (
              <Text className="text-[12.5px] text-[#72818C]">Chưa có ảnh.</Text>
            ) : null}
            {photos.map((url, index) => (
              <Pressable key={url} onPress={() => setViewerIndex(index)} className="w-[49%]">
                <Image
                  source={{ uri: url }}
                  style={{ width: '100%', height: 110, borderRadius: 12 }}
                />
              </Pressable>
            ))}
          </View>
        ) : null}

        {tab === 'contact' ? (
          <View>
            <ContactRow
              icon="location-on"
              label="Địa chỉ"
              value={summary.address ?? 'Chưa cập nhật'}
            />
            <ContactRow
              icon="call"
              label="Điện thoại"
              value={place.phone ?? 'Chưa cập nhật'}
              onPress={
                place.phone
                  ? () => void Linking.openURL(`tel:${place.phone?.replace(/\s+/g, '')}`)
                  : undefined
              }
            />
            <ContactRow
              icon="language"
              label="Website"
              value={place.website ?? 'Chưa cập nhật'}
              onPress={place.website ? () => void Linking.openURL(place.website ?? '') : undefined}
            />
            <View style={{ height: 180, borderRadius: 16, overflow: 'hidden', marginTop: 12 }}>
              <PlacesMap
                points={[
                  {
                    id: String(placeId),
                    latitude: place.latitude,
                    longitude: place.longitude,
                    label: '1',
                    title: summary.name,
                  },
                ]}
              />
            </View>
          </View>
        ) : null}

        {tab === 'reviews' ? (
          reviews === null ? (
            <Loading label="Đang tải đánh giá…" />
          ) : reviews.length === 0 ? (
            <Text className="text-[12.5px] text-[#72818C]">Chưa có đánh giá nào.</Text>
          ) : (
            <View className="gap-4">
              {reviews.map((review) => (
                <View key={review.reviewId}>
                  <View className="flex-row items-center gap-2.5">
                    <Avatar name={review.userName} url={review.userAvatarUrl} size={36} />
                    <View className="min-w-0 flex-1">
                      <Text className="text-[13px] font-bold text-[#13364A]">
                        {review.userName ?? 'Khách Smart Travel'}
                      </Text>
                      <Text className="text-[11px] text-[#8793AB]">
                        {formatDate(review.createdAt)}
                      </Text>
                    </View>
                    <Stars value={review.rating} size={14} />
                  </View>
                  {review.comment ? (
                    <Text className="mt-2 text-[13px] leading-5 text-[#3B4B57]">
                      {review.comment}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          )
        ) : null}
      </View>

      <ImageViewer
        images={photos}
        index={viewerIndex}
        onChange={setViewerIndex}
        onClose={() => setViewerIndex(null)}
      />
    </Screen>
  );
}
