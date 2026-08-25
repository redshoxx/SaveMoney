import { Appearance, DynamicColorIOS, Platform, type ColorValue } from 'react-native';

const light = {
  background: '#F5F7F4',
  surface: '#FFFFFF',
  surfaceMuted: '#EDF1EC',
  text: '#152018',
  textMuted: '#6C776F',
  primary: '#197447',
  primaryDark: '#115A35',
  primarySoft: '#DCEFE4',
  border: '#E0E6E1',
  success: '#197447',
  warning: '#A96316',
  danger: '#B43E3E',
  dangerSoft: '#FBE8E8',
  disabled: '#D7DDD8',
  purple: '#7452B7',
  blue: '#3574B8',
} as const;

const dark = {
  background: '#0B100D',
  surface: '#151B17',
  surfaceMuted: '#202821',
  text: '#F2F6F3',
  textMuted: '#9AA59D',
  primary: '#58C884',
  primaryDark: '#96E5B4',
  primarySoft: '#1D3928',
  border: '#2B352E',
  success: '#58C884',
  warning: '#E0A35C',
  danger: '#EF8585',
  dangerSoft: '#3A2325',
  disabled: '#354039',
  purple: '#AC91E2',
  blue: '#7AADE4',
} as const;

type Palette = typeof light;
type PaletteKey = keyof Palette;
export type ResolvedColorScheme = 'light' | 'dark';
export type AppThemeMode = 'system' | ResolvedColorScheme;

let activeScheme: ResolvedColorScheme = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';

export function setActiveColorScheme(scheme: ResolvedColorScheme) {
  activeScheme = scheme;
}

export function applyNativeThemeMode(mode: AppThemeMode) {
  Appearance.setColorScheme(mode === 'system' ? null : mode);
}

function resolveColor(key: PaletteKey): ColorValue {
  if (Platform.OS === 'ios') {
    return DynamicColorIOS({ light: light[key], dark: dark[key] });
  }
  return activeScheme === 'dark' ? dark[key] : light[key];
}

export const colors = {
  get background(): ColorValue { return resolveColor('background'); },
  get surface(): ColorValue { return resolveColor('surface'); },
  get surfaceMuted(): ColorValue { return resolveColor('surfaceMuted'); },
  get text(): ColorValue { return resolveColor('text'); },
  get textMuted(): ColorValue { return resolveColor('textMuted'); },
  get primary(): ColorValue { return resolveColor('primary'); },
  get primaryDark(): ColorValue { return resolveColor('primaryDark'); },
  get primarySoft(): ColorValue { return resolveColor('primarySoft'); },
  get border(): ColorValue { return resolveColor('border'); },
  get success(): ColorValue { return resolveColor('success'); },
  get warning(): ColorValue { return resolveColor('warning'); },
  get danger(): ColorValue { return resolveColor('danger'); },
  get dangerSoft(): ColorValue { return resolveColor('dangerSoft'); },
  get disabled(): ColorValue { return resolveColor('disabled'); },
  get purple(): ColorValue { return resolveColor('purple'); },
  get blue(): ColorValue { return resolveColor('blue'); },
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 26,
};

export const shadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
