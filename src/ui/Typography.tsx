import { cssInterop } from 'nativewind';
import { createContext, forwardRef, useContext, type ReactNode } from 'react';
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from 'react-native';
import { useI18n } from '../i18n/I18nProvider';

/**
 * Font chữ dùng chung với web du khách: Be Vietnam Pro (--font-sans của web).
 * Android không tự làm đậm font tuỳ chỉnh theo fontWeight, nên đổi fontWeight → đúng tệp font.
 */
export const FONT_FILES = {
  400: 'BeVietnamPro_400Regular',
  500: 'BeVietnamPro_500Medium',
  600: 'BeVietnamPro_600SemiBold',
  700: 'BeVietnamPro_700Bold',
  800: 'BeVietnamPro_800ExtraBold',
} as const;

function familyFor(weight: TextStyle['fontWeight']): string {
  const value =
    weight === 'bold' ? 700 : weight === 'normal' || weight === undefined ? 400 : Number(weight);
  if (!Number.isFinite(value) || value < 450) return FONT_FILES[400];
  if (value < 550) return FONT_FILES[500];
  if (value < 650) return FONT_FILES[600];
  if (value < 750) return FONT_FILES[700];
  return FONT_FILES[800];
}

/** Đang nằm trong một Text khác: chữ con không đặt độ đậm thì kế thừa font của chữ cha */
const InsideText = createContext(false);

function withFont(style: TextProps['style'], nested: boolean): TextProps['style'] {
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  if (flat.fontFamily) return flat;
  if (nested && flat.fontWeight === undefined) return flat;
  return { ...flat, fontFamily: familyFor(flat.fontWeight), fontWeight: 'normal' };
}

function translateChildren(children: ReactNode, t: (s: string) => string): ReactNode {
  if (typeof children === 'string') return t(children);
  if (Array.isArray(children)) {
    // Ghép chuỗi thuần (vd. "Xin chào, ", name, " 👋") để dịch đúng ngữ cảnh
    if (children.every((part) => typeof part === 'string' || typeof part === 'number')) {
      return t(children.map(String).join(''));
    }
    return children.map((part) => (typeof part === 'string' ? t(part) : part));
  }
  return children;
}

export const Text = forwardRef<RNText, TextProps>(function Text(
  { style, children, ...props },
  ref,
) {
  const nested = useContext(InsideText);
  const { lang, t } = useI18n();
  const rendered = lang === 'en' ? translateChildren(children, t) : children;
  return (
    <InsideText.Provider value>
      <RNText ref={ref} {...props} style={withFont(style, nested)}>
        {rendered}
      </RNText>
    </InsideText.Provider>
  );
});

export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput(
  { style, placeholder, ...props },
  ref,
) {
  const { lang, t } = useI18n();
  return (
    <RNTextInput
      ref={ref}
      {...props}
      placeholder={lang === 'en' && placeholder ? t(placeholder) : placeholder}
      style={withFont(style, false)}
    />
  );
});

// className (NativeWind) → style trước khi tới component, để đọc được font-bold / font-extrabold…
cssInterop(Text, { className: 'style' });
cssInterop(TextInput, { className: 'style' });
