import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { Text, TextInput } from '../ui/Typography';
import { errorMessage, type UploadFile } from '../api/http';
import { placeReviewApi, type PlaceReview } from '../api/placeReviewApi';
import { useAuth } from '../auth/AuthProvider';
import { colors } from '../theme';
import { Avatar, Stars } from '../ui/Bits';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Notice } from '../ui/States';

const MAX_PHOTOS = 5;
const MAX_COMMENT = 2000;
const RATING_LABELS = ['', 'Tệ', 'Chưa tốt', 'Bình thường', 'Tốt', 'Tuyệt vời'];

/** Ảnh chọn từ thư viện → dạng gửi multipart */
export function toUploadFile(asset: ImagePicker.ImagePickerAsset, index: number): UploadFile {
  const type = asset.mimeType ?? 'image/jpeg';
  const extension = type.split('/')[1] ?? 'jpg';
  return { uri: asset.uri, name: asset.fileName ?? `photo-${Date.now()}-${index}.${extension}`, type };
}

/**
 * Nhận xét một địa điểm — 1-5 sao + bình luận + tối đa 5 ảnh (giống StopReviewCard của web).
 * Chỉ viết được khi đã thực sự đi địa điểm này (Backend trả canReview).
 */
export default function ReviewForm({
  placeId,
  stopTitle,
  onSubmitted,
}: {
  placeId: number;
  stopTitle: string;
  onSubmitted?: (review: PlaceReview) => void;
}) {
  const { user } = useAuth();
  const [canReview, setCanReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [justSubmitted, setJustSubmitted] = useState<PlaceReview | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setJustSubmitted(null);
    setRating(0);
    setComment('');
    setPhotos([]);
    placeReviewApi
      .mine(placeId)
      .then((status) => active && setCanReview(status.canReview))
      .catch((caught: unknown) => active && setError(errorMessage(caught)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [placeId]);

  const pickPhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Cần cho phép truy cập thư viện ảnh để thêm ảnh.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.8,
    });
    if (result.canceled) return;
    setPhotos((current) => [...current, ...result.assets.map(toUploadFile)].slice(0, MAX_PHOTOS));
  };

  const submit = () => {
    if (rating === 0) {
      setError('Hãy chọn số sao cho địa điểm này.');
      return;
    }
    setError(null);
    setSubmitting(true);
    placeReviewApi
      .create(placeId, { rating, comment, photos })
      .then((result) => {
        setJustSubmitted(result);
        setCanReview(false);
        setPhotos([]);
        onSubmitted?.(result);
      })
      .catch((caught: unknown) => setError(errorMessage(caught)))
      .finally(() => setSubmitting(false));
  };

  if (loading) {
    return (
      <View className="rounded-2xl bg-white p-4">
        <Text className="text-[12.5px] text-[#8793AB]">Đang kiểm tra quyền đánh giá…</Text>
      </View>
    );
  }

  if (justSubmitted) {
    return (
      <View className="rounded-2xl bg-[#E6F7F0] p-4">
        <View className="flex-row items-center gap-2">
          <Icon name="check-circle" size={20} color={colors.success} />
          <Text className="text-[14px] font-extrabold text-[#13704F]">Đã gửi nhận xét</Text>
        </View>
        <Text className="mt-1 text-[12.5px] text-[#13704F]">
          Cảm ơn bạn đã chia sẻ trải nghiệm tại {stopTitle}.
        </Text>
      </View>
    );
  }

  if (!canReview) {
    return (
      <View className="rounded-2xl bg-white p-4">
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <View className="flex-row items-start gap-2">
          <Icon name="info-outline" size={18} color={colors.muted} />
          <Text className="flex-1 text-[12.5px] leading-5 text-[#557080]">
            Bạn có thể viết đánh giá sau khi hoàn thành địa điểm này trong một chuyến đi. Mỗi lần đi
            được đánh giá một lần.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="rounded-2xl bg-white p-4">
      <View className="flex-row items-center gap-2.5">
        <Avatar name={user?.name} url={user?.avatarUrl} size={40} />
        <Text numberOfLines={1} className="flex-1 text-[14px] font-extrabold text-[#17344A]">
          {user?.name ?? 'Bạn'}
        </Text>
      </View>
      <Text className="mb-2 mt-3 text-[13px] font-bold text-[#13364A]">Bạn thấy {stopTitle} thế nào?</Text>
      <View className="flex-row items-center gap-3">
        <Stars value={rating} size={30} onChange={setRating} />
        {rating > 0 ? <Text className="text-[12.5px] font-bold text-[#B07A00]">{RATING_LABELS[rating]}</Text> : null}
      </View>
      <TextInput
        value={comment}
        onChangeText={setComment}
        maxLength={MAX_COMMENT}
        multiline
        placeholder="Chia sẻ trải nghiệm của bạn (không bắt buộc)"
        placeholderTextColor="#93A7B1"
        style={{
          marginTop: 12,
          minHeight: 90,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.field,
          padding: 12,
          fontSize: 13.5,
          color: colors.ink,
          textAlignVertical: 'top',
        }}
      />
      <Text className="mt-1 self-end text-[10.5px] text-[#93A7B1]">
        {comment.length}/{MAX_COMMENT}
      </Text>
      <View className="mt-2 flex-row flex-wrap gap-2">
        {photos.map((photo, index) => (
          <View key={photo.uri} className="h-16 w-16 overflow-hidden rounded-xl">
            <Image source={{ uri: photo.uri }} style={{ width: '100%', height: '100%' }} />
            <Pressable
              onPress={() => setPhotos((current) => current.filter((_, i) => i !== index))}
              accessibilityLabel="Bỏ ảnh"
              className="absolute right-0.5 top-0.5 h-5 w-5 items-center justify-center rounded-full bg-black/60"
            >
              <Icon name="close" size={13} color="#FFFFFF" />
            </Pressable>
          </View>
        ))}
        {photos.length < MAX_PHOTOS ? (
          <Pressable
            onPress={() => void pickPhotos()}
            className="h-16 w-16 items-center justify-center rounded-xl border border-dashed border-[#A9C9D2]"
          >
            <Icon name="add-a-photo" size={20} color={colors.primary} />
            <Text className="text-[9.5px] font-bold text-[#0891B2]">Thêm ảnh</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View className="mt-3">
          <Notice tone="danger">{error}</Notice>
        </View>
      ) : null}
      <Button title="Gửi nhận xét" icon="send" loading={submitting} style={{ marginTop: 12 }} onPress={submit} />
      <Text className="mt-2 text-center text-[11px] text-[#8793AB]">Đánh giá đã gửi không sửa hoặc xoá được.</Text>
    </View>
  );
}
