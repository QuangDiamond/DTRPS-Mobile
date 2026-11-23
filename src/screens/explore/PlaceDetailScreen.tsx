import { useEffect, useState } from 'react';
import { Dimensions, Image, Linking, Pressable, ScrollView, Share, View } from 'react-native';
import { Text } from '../../ui/Typography';
import { ClientApiError, errorMessage } from '../../api/http';
import { placeReviewApi, type PlaceReview } from '../../api/placeReviewApi';
import { placesApi } from '../../api/placesApi';
import type { PlaceDetail } from '../../api/types';
import { useAuth } from '../../auth/AuthProvider';
import ImageViewer from '../../components/ImageViewer';
import { FavoriteButton } from '../../components/PlaceCard';
import PlaceDirectionsMap from '../../components/PlaceDirectionsMap';
import ReportReviewSheet from '../../components/ReportReviewSheet';
import ReviewForm from '../../components/ReviewForm';
import TodayWeatherCard from '../../components/TodayWeatherCard';
import type { RootScreenProps } from '../../navigation/types';
import { colors } from '../../theme';
import { Avatar, Badge, Stars } from '../../ui/Bits';
import { Button, IconButton } from '../../ui/Button';
import { Icon, type IconName } from '../../ui/Icon';
import { Header, Screen } from '../../ui/Screen';
import { EmptyState, ErrorState, Loading } from '../../ui/States';
import { formatDate } from '../../utils/format';

const REVIEWS_PAGE_SIZE = 5;
const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const PRICE_LABELS: Record<string, string> = {
  TICKET: 'Vé vào cổng',
  ROOM_NIGHT: 'Giá phòng / đêm',
  AVG_MEAL: 'Giá món / bữa ăn',
  AVG_DRINK: 'Giá đồ uống',
  OTHER: 'Khác',
};

const formatVnd = (amount: number) =>
  amount === 0 ? 'Miễn phí' : `${Math.round(amount).toLocaleString('vi-VN')}đ`;

/** 1 = Thứ 2 … 7 = Chủ nhật */
const todayOfWeek = () => (new Date().getDay() === 0 ? 7 : new Date().getDay());

function parseMinutes(hhmm: string | null): number | null {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return Number.isNaN(h) || Number.isNaN(m) ? null : h * 60 + m;
}

/** Đang mở cửa theo giờ hiện tại (giống isOpenNow của web) */
function isOpenNow(detail: PlaceDetail): boolean {
  if (detail.openingHours.length === 0) return true;
  const today = detail.openingHours.find((hour) => hour.dayOfWeek === todayOfWeek());
  if (!today || today.closed) return false;
  const open = parseMinutes(today.openTime);
  const close = parseMinutes(today.closeTime);
  if (open === null || close === null) return true;
  const now = new Date().getHours() * 60 + new Date().getMinutes();
  // Hỗ trợ quán mở qua nửa đêm (vd. 18:00 - 02:00)
  return close >= open ? now >= open && now <= close : now >= open || now <= close;
}

function todayHoursLabel(detail: PlaceDetail): string {
  if (detail.openingHours.length === 0) return 'Mở cả ngày';
  const today = detail.openingHours.find((hour) => hour.dayOfWeek === todayOfWeek());
  if (!today || today.closed) return 'Đóng cửa hôm nay';
  return today.openTime && today.closeTime ? `${today.openTime} - ${today.closeTime}` : 'Cả ngày';
}

function cheapestPriceLabel(detail: PlaceDetail): string {
  if (detail.prices.length === 0) return 'Chưa có giá';
  const paid = detail.prices.filter((price) => price.amount > 0).map((price) => price.amount);
  if (paid.length === 0) return 'Miễn phí';
  return `Từ ${formatVnd(Math.min(...paid))}`;
}

function websiteLabel(website: string | null): string {
  if (!website) return 'Chưa cập nhật';
  return website.replace(/^https?:\/\//, '').split('/')[0];
}

function InfoTile({
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
      className="w-[48.5%] rounded-2xl bg-white p-3.5"
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#ECFEFF]">
        <Icon name={icon} size={19} color={colors.primary} />
      </View>
      <Text className="mt-2 text-[11px] text-[#72818C]">{label}</Text>
      <Text numberOfLines={2} className="text-[13px] font-bold text-[#13364A]">
        {value}
      </Text>
    </Pressable>
  );
}

function ReviewCard({
  review,
  reported,
  onReport,
  onOpenImage,
  own,
}: {
  review: PlaceReview;
  reported: boolean;
  onReport: () => void;
  onOpenImage: (urls: string[], index: number) => void;
  own: boolean;
}) {
  return (
    <View className="rounded-2xl bg-white p-4">
      <View className="flex-row items-center gap-3">
        <Avatar name={review.userName} url={review.userAvatarUrl} size={44} />
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="text-[14.5px] font-extrabold text-[#13364A]">
            {review.userName ?? 'Khách Smart Travel'}
          </Text>
          <Text className="text-[11.5px] text-[#8793AB]">{formatDate(review.createdAt)}</Text>
        </View>
        <Stars value={review.rating} size={15} />
        {!own ? (
          reported ? (
            <Icon name="flag" size={18} color="#B0BBC7" />
          ) : (
            <Pressable onPress={onReport} hitSlop={8} accessibilityLabel="Báo cáo đánh giá">
              <Icon name="more-vert" size={20} color="#8793AB" />
            </Pressable>
          )
        ) : null}
      </View>
      {review.comment ? (
        <Text className="mt-3 text-[14px] leading-[22px] text-[#3B4B57]">{review.comment}</Text>
      ) : null}
      {review.imageUrls.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, marginTop: 10 }}
        >
          {review.imageUrls.map((url, idx) => (
            <Pressable key={url} onPress={() => onOpenImage(review.imageUrls, idx)}>
              <Image source={{ uri: url }} style={{ width: 84, height: 84, borderRadius: 12 }} />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

/** Chi tiết điểm đến — GET /api/places/{id} (giống PlaceDetailsPage của web) */
export default function PlaceDetailScreen({ navigation, route }: RootScreenProps<'PlaceDetail'>) {
  const { placeId } = route.params;
  const { user } = useAuth();
  const width = Dimensions.get('window').width;
  const [detail, setDetail] = useState<PlaceDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [introExpanded, setIntroExpanded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);
  const [reviews, setReviews] = useState<PlaceReview[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [reviewsVersion, setReviewsVersion] = useState(0);
  const [reportedIds, setReportedIds] = useState<Set<number>>(new Set());
  const [reporting, setReporting] = useState<PlaceReview | null>(null);
  const [openMapSignal, setOpenMapSignal] = useState(0);

  useEffect(() => {
    let active = true;
    setDetail(null);
    setNotFound(false);
    setLoadError(null);
    placesApi
      .get(placeId)
      .then((result) => active && setDetail(result))
      .catch((failure: unknown) => {
        if (!active) return;
        if (failure instanceof ClientApiError && failure.status === 404) setNotFound(true);
        else setLoadError(errorMessage(failure));
      });
    return () => {
      active = false;
    };
  }, [placeId, retry]);

  useEffect(() => {
    if (!user) {
      setReportedIds(new Set());
      return;
    }
    let active = true;
    placeReviewApi
      .reported(placeId)
      .then((ids) => active && setReportedIds(new Set(ids)))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [placeId, user]);

  useEffect(() => {
    let active = true;
    setReviewsLoading(true);
    setReviewsError(null);
    placeReviewApi
      .list(placeId, reviewsPage, REVIEWS_PAGE_SIZE)
      .then((result) => {
        if (!active) return;
        setReviews((current) => (reviewsPage === 0 ? result.items : [...current, ...result.items]));
        setReviewsTotal(result.total);
      })
      .catch((failure: unknown) => active && setReviewsError(errorMessage(failure)))
      .finally(() => active && setReviewsLoading(false));
    return () => {
      active = false;
    };
  }, [placeId, reviewsPage, reviewsVersion]);

  const header = (
    <Header
      title="Chi tiết điểm đến"
      onBack={() => navigation.goBack()}
      right={
        detail ? (
          <IconButton
            icon="share"
            label="Chia sẻ"
            onPress={() =>
              void Share.share({
                message: `${detail.summary.name} - ${detail.summary.address ?? ''}\nKhám phá cùng SmartTravel Vietnam AI ✨`,
              })
            }
          />
        ) : undefined
      }
    />
  );

  if (notFound) {
    return (
      <Screen header={header}>
        <EmptyState
          icon="location-off"
          title="Không tìm thấy địa điểm"
          message="Địa điểm có thể đã bị ẩn hoặc xoá."
        />
      </Screen>
    );
  }
  if (loadError) {
    return (
      <Screen header={header}>
        <ErrorState
          message={`Không tải được địa điểm: ${loadError}`}
          onRetry={() => setRetry((n) => n + 1)}
        />
      </Screen>
    );
  }
  if (!detail) {
    return (
      <Screen header={header}>
        <Loading label="Đang tải địa điểm…" />
      </Screen>
    );
  }

  const place = detail.summary;
  const images =
    detail.images.length > 0
      ? [...detail.images]
          .sort((a, b) => Number(b.primary) - Number(a.primary))
          .map((image) => image.url)
      : place.coverUrl
        ? [place.coverUrl]
        : [];
  const openNow = isOpenNow(detail);
  const imageWidth = width - 32;

  return (
    <Screen header={header}>
      {/* Ảnh địa điểm, vuốt ngang để chuyển ảnh, bấm để phóng to */}
      <View
        style={{ height: 250, borderRadius: 24, overflow: 'hidden', backgroundColor: '#CEE7EA' }}
      >
        {images.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) =>
              setActiveImage(Math.round(event.nativeEvent.contentOffset.x / imageWidth))
            }
          >
            {images.map((url, idx) => (
              <Pressable key={url} onPress={() => setViewer({ images, index: idx })}>
                <Image source={{ uri: url }} style={{ width: imageWidth, height: 250 }} />
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Icon name="image" size={48} color="#FFFFFF" />
          </View>
        )}
        <View
          className="absolute left-3 top-3 flex-row items-center gap-1.5 rounded-full px-3 py-1"
          style={{ backgroundColor: openNow ? '#ECFDF5' : '#FEF2F2' }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: openNow ? '#10B981' : '#EF4444',
            }}
          />
          <Text
            style={{ color: openNow ? '#0F766E' : '#B91C1C' }}
            className="text-[11px] font-bold"
          >
            {openNow ? 'Đang mở' : 'Đóng cửa'}
          </Text>
        </View>
        <View className="absolute right-3 top-3">
          <FavoriteButton placeId={place.id} size={40} />
        </View>
        {images.length > 1 ? (
          <View className="absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1">
            <Text className="text-[11.5px] font-bold text-white">
              {activeImage + 1} / {images.length}
            </Text>
          </View>
        ) : null}
      </View>

      <Text className="mt-4 text-[24px] font-extrabold leading-[30px] text-[#13364A]">
        {place.name}
      </Text>
      <View className="mt-2 flex-row flex-wrap items-center gap-2">
        <View className="flex-row items-center gap-1">
          <Icon name="star" size={17} color="#E0A100" />
          <Text className="text-[13.5px] font-bold text-[#13364A]">{place.rating ?? 'Mới'}</Text>
          {place.rating !== null ? (
            <Text className="text-[12px] text-[#72818C]">({place.reviewCount} đánh giá)</Text>
          ) : null}
        </View>
        {place.province ? <Badge label={place.province.name} icon="location-city" /> : null}
      </View>
      <View className="mt-2 flex-row flex-wrap gap-1.5">
        {(place.categories && place.categories.length > 0
          ? place.categories
          : place.category
            ? [place.category]
            : []
        ).map((type) => (
          <Badge key={type.code} label={type.name} bg="#F1F5F9" fg="#405A6E" />
        ))}
      </View>
      <Pressable
        onPress={() => setOpenMapSignal((count) => count + 1)}
        className="mt-3 flex-row items-start gap-1.5"
      >
        <Icon name="location-on" size={17} color={colors.primary} style={{ marginTop: 1 }} />
        <Text className="flex-1 text-[13px] leading-5 text-[#405A6E]">
          {place.address ?? 'Chưa cập nhật địa chỉ'}
        </Text>
      </Pressable>

      {/* Giới thiệu */}
      <View className="mt-4 rounded-2xl bg-white p-4">
        <Text className="mb-1.5 text-[15px] font-extrabold text-[#13364A]">Giới thiệu</Text>
        <Text
          numberOfLines={introExpanded ? undefined : 4}
          className="text-[13.5px] leading-[22px] text-[#3B4B57]"
        >
          {detail.description ?? 'Chưa có mô tả cho địa điểm này.'}
        </Text>
        {detail.description && detail.description.length > 180 ? (
          <Pressable
            onPress={() => setIntroExpanded((v) => !v)}
            className="mt-1 flex-row items-center"
          >
            <Text className="text-[12.5px] font-bold text-[#0891B2]">
              {introExpanded ? 'Thu gọn' : 'Xem thêm'}
            </Text>
            <Icon
              name={introExpanded ? 'expand-less' : 'expand-more'}
              size={18}
              color={colors.primary}
            />
          </Pressable>
        ) : null}
      </View>

      {/* Thông tin nhanh */}
      <View className="mt-4 flex-row flex-wrap justify-between gap-y-3">
        <InfoTile icon="schedule" label="Giờ mở cửa hôm nay" value={todayHoursLabel(detail)} />
        <InfoTile icon="sell" label="Giá tham khảo" value={cheapestPriceLabel(detail)} />
        <InfoTile
          icon="call"
          label="Điện thoại"
          value={detail.phone ?? 'Chưa cập nhật'}
          onPress={
            detail.phone
              ? () => void Linking.openURL(`tel:${detail.phone?.replace(/\s+/g, '')}`)
              : undefined
          }
        />
        <InfoTile
          icon="language"
          label="Website"
          value={websiteLabel(detail.website)}
          onPress={detail.website ? () => void Linking.openURL(detail.website ?? '') : undefined}
        />
      </View>

      <Text className="mb-2.5 mt-6 text-[16px] font-extrabold text-[#13364A]">
        Thời tiết hôm nay
      </Text>
      <TodayWeatherCard placeId={place.id} />

      <Text className="mb-2.5 mt-6 text-[16px] font-extrabold text-[#13364A]">
        Bảng giá tham khảo
      </Text>
      <View className="rounded-2xl bg-white p-4">
        {detail.prices.length === 0 ? (
          <Text className="text-[12.5px] text-[#72818C]">Chưa có thông tin giá.</Text>
        ) : (
          detail.prices.map((price, idx) => (
            <View
              key={`${price.priceType}-${idx}`}
              className={`flex-row items-center justify-between py-2.5 ${idx > 0 ? 'border-t border-[#EEF1F4]' : ''}`}
            >
              <Text className="flex-1 text-[13px] text-[#3B4B57]">
                {price.description ?? PRICE_LABELS[price.priceType] ?? 'Giá'}
              </Text>
              <Text className="text-[13.5px] font-extrabold text-[#0E7490]">
                {formatVnd(price.amount)}
              </Text>
            </View>
          ))
        )}
      </View>

      <Text className="mb-2.5 mt-6 text-[16px] font-extrabold text-[#13364A]">Giờ mở cửa</Text>
      <View className="rounded-2xl bg-white p-4">
        {detail.openingHours.length === 0 ? (
          <Text className="text-[12.5px] text-[#72818C]">Chưa cập nhật giờ mở cửa.</Text>
        ) : (
          detail.openingHours.map((hour) => {
            const today = hour.dayOfWeek === todayOfWeek();
            return (
              <View key={hour.dayOfWeek} className="flex-row justify-between py-1.5">
                <Text
                  className={`text-[13px] ${today ? 'font-extrabold text-[#0E7490]' : 'text-[#3B4B57]'}`}
                >
                  {DAY_LABELS[hour.dayOfWeek - 1]}
                  {today ? ' (hôm nay)' : ''}
                </Text>
                <Text
                  className={`text-[13px] font-semibold ${hour.closed ? 'text-[#C2412D]' : 'text-[#13364A]'}`}
                >
                  {hour.closed
                    ? 'Đóng cửa'
                    : `${hour.openTime ?? '--'} - ${hour.closeTime ?? '--'}`}
                </Text>
              </View>
            );
          })
        )}
      </View>

      <PlaceDirectionsMap
        placeId={place.id}
        placeName={place.name}
        address={place.address}
        latitude={detail.latitude}
        longitude={detail.longitude}
        isAuthenticated={Boolean(user)}
        onRequireLogin={() => navigation.navigate('Login')}
        openMapSignal={openMapSignal}
      />

      {/* Đánh giá */}
      <View className="mb-3 mt-7 flex-row items-center justify-between">
        <Text className="text-[17px] font-extrabold text-[#13364A]">Đánh giá địa điểm</Text>
        <View className="flex-row items-center gap-1">
          <Icon name="star" size={17} color="#E0A100" />
          <Text className="text-[14px] font-bold text-[#13364A]">{place.rating ?? 'Mới'}</Text>
          {place.rating !== null ? (
            <Text className="text-[12px] text-[#72818C]">({place.reviewCount})</Text>
          ) : null}
        </View>
      </View>

      {user ? (
        <ReviewForm
          placeId={place.id}
          stopTitle={place.name}
          onSubmitted={() => {
            setReviewsPage(0);
            setReviewsVersion((v) => v + 1);
            placesApi
              .get(placeId)
              .then(setDetail)
              .catch(() => undefined);
          }}
        />
      ) : (
        <View className="flex-row items-center justify-between gap-3 rounded-2xl bg-white p-4">
          <Text className="flex-1 text-[13px] text-[#72818C]">
            Đăng nhập để viết đánh giá cho địa điểm này.
          </Text>
          <Button
            title="Đăng nhập"
            size="sm"
            full={false}
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      )}

      <View className="mt-3 gap-3">
        {reviewsError ? (
          <ErrorState message={reviewsError} onRetry={() => setReviewsVersion((v) => v + 1)} />
        ) : null}
        {!reviewsLoading && !reviewsError && reviews.length === 0 ? (
          <Text className="py-4 text-center text-[13px] text-[#72818C]">
            Chưa có đánh giá nào. Hãy là người đầu tiên!
          </Text>
        ) : null}
        {reviews.map((review) => (
          <ReviewCard
            key={review.reviewId}
            review={review}
            own={user?.id === review.userId}
            reported={reportedIds.has(review.reviewId)}
            onReport={() => (user ? setReporting(review) : navigation.navigate('Login'))}
            onOpenImage={(urls, index) => setViewer({ images: urls, index })}
          />
        ))}
        {reviewsLoading ? <Loading label="Đang tải đánh giá…" /> : null}
        {!reviewsLoading && reviews.length < reviewsTotal ? (
          <Button
            title={`Xem thêm đánh giá (${reviewsTotal - reviews.length})`}
            variant="secondary"
            onPress={() => setReviewsPage((p) => p + 1)}
          />
        ) : null}
      </View>

      <ImageViewer
        images={viewer?.images ?? []}
        index={viewer?.index ?? null}
        onChange={(index) => setViewer((current) => (current ? { ...current, index } : current))}
        onClose={() => setViewer(null)}
      />
      <ReportReviewSheet
        placeId={place.id}
        review={reporting}
        onClose={() => setReporting(null)}
        onReported={(id) => setReportedIds((current) => new Set(current).add(id))}
      />
    </Screen>
  );
}
