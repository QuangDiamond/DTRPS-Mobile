import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../ui/Typography';
import { errorMessage } from '../api/http';
import { tripFlowApi, type TripFeedbackResponse } from '../api/tripFlowApi';
import { colors } from '../theme';
import { Sheet, Stars } from '../ui/Bits';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Icon } from '../ui/Icon';
import { Notice } from '../ui/States';

const MAX_COMMENT = 2000;
const RATING_LABELS = ['', 'Tệ', 'Chưa tốt', 'Bình thường', 'Tốt', 'Tuyệt vời'];

/** Đánh giá chuyến đi (1-5 sao + nhận xét) — tự hiện khi kế hoạch COMPLETED (giống web) */
export default function TripFeedbackSheet({
  planId,
  visible,
  onClose,
  onSubmitted,
}: {
  planId: number;
  visible: boolean;
  onClose: () => void;
  onSubmitted?: (feedback: TripFeedbackResponse) => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = () => {
    if (rating === 0) {
      setError('Hãy chọn số sao đánh giá.');
      return;
    }
    setError(null);
    setSubmitting(true);
    tripFlowApi
      .createFeedback(planId, { rating, comment: comment.trim() || null })
      .then((feedback) => {
        setDone(true);
        onSubmitted?.(feedback);
      })
      .catch((caught: unknown) => setError(errorMessage(caught)))
      .finally(() => setSubmitting(false));
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={done ? 'Cảm ơn bạn!' : 'Đánh giá chuyến đi'}
      footer={
        done ? (
          <Button title="Đóng" onPress={onClose} />
        ) : (
          <Button title="Gửi đánh giá" icon="send" loading={submitting} onPress={submit} />
        )
      }
    >
      {done ? (
        <View className="items-center py-4">
          <Icon name="check-circle" size={48} color={colors.success} />
          <Text className="mt-2 text-[16px] font-extrabold text-[#13364A]">Cảm ơn bạn đã đánh giá!</Text>
          <Text className="mt-1 text-center text-[12.5px] text-[#72818C]">
            Nhận xét của bạn giúp chúng tôi cải thiện trải nghiệm chuyến đi.
          </Text>
        </View>
      ) : (
        <View>
          <Text className="mb-4 text-[13px] leading-5 text-[#557080]">
            Chuyến đi của bạn đã hoàn thành. Hãy chấm sao và chia sẻ cảm nhận của bạn.
          </Text>
          <View className="mb-1 items-center">
            <Stars value={rating} size={36} onChange={setRating} />
            <Text className="mt-1.5 h-5 text-[13px] font-bold text-[#B07A00]">{RATING_LABELS[rating]}</Text>
          </View>
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <Field
            label="Nhận xét (không bắt buộc)"
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={MAX_COMMENT}
            placeholder="Chuyến đi của bạn thế nào?"
          />
        </View>
      )}
    </Sheet>
  );
}
