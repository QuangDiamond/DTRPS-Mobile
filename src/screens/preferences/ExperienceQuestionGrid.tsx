import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ExperienceQuestionOption } from './experienceQuestions';

const COLORS = {
  primary: '#00685F',
  text: '#131B2E',
  selectedBg: '#EAF8F4',
  border: '#E3E7F0',
  emojiBg: '#F1F4F6',
  emojiSelectedBg: '#D5F2E9',
};

/** Lưới đáp án của một câu hỏi cá nhân hóa — port của ExperienceQuestions.tsx bên Web. */
export default function ExperienceQuestionGrid({
  options,
  selected,
  onToggle,
}: {
  options: ExperienceQuestionOption[];
  selected: string[];
  onToggle: (code: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap justify-between">
      {options.map((option) => {
        const isSelected = selected.includes(option.code);
        return (
          <Pressable
            key={option.code}
            onPress={() => onToggle(option.code)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            className="mb-2.5 flex-row items-center rounded-2xl p-3"
            style={{
              width: '48.5%',
              minHeight: 64,
              borderWidth: isSelected ? 2 : 1,
              borderColor: isSelected ? COLORS.primary : COLORS.border,
              backgroundColor: isSelected ? COLORS.selectedBg : 'white',
            }}
          >
            <View
              className="h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: isSelected ? COLORS.emojiSelectedBg : COLORS.emojiBg }}
            >
              <Text style={{ fontSize: 17 }}>{option.emoji}</Text>
            </View>
            <Text
              className="ml-2.5 flex-1 text-[12.5px] font-semibold"
              style={{ color: COLORS.text }}
            >
              {option.label}
            </Text>
            {isSelected && (
              <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.primary} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
