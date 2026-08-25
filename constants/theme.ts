import { Appearance } from 'react-native';

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

export type ResolvedColorScheme = 'light' | 'dark';
export type AppThemeMode = 'system' | ResolvedColorScheme;

let activeScheme: ResolvedColorScheme = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';

export function setActiveColorScheme(scheme: ResolvedColorScheme) {
  activeScheme = scheme;
}

export function applyNativeThemeMode(mode: AppThemeMode) {
  Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
}

function palette() {
  return activeScheme === 'dark' ? dark : light;
}

export const colors = {
  get background(): string { return palette().background; },
  get surface(): string { return palette().surface; },
  get surfaceMuted(): string { return palette().surfaceMuted; },
  get text(): string { return palette().text; },
  get textMuted(): string { return palette().textMuted; },
  get primary(): string { return palette().primary; },
  get primaryDark(): string { return palette().primaryDark; },
  get primarySoft(): string { return palette().primarySoft; },
  get border(): string { return palette().border; },
  get success(): string { return palette().success; },
  get warning(): string { return palette().warning; },
  get danger(): string { return palette().danger; },
  get dangerSoft(): string { return palette().dangerSoft; },
  get disabled(): string { return palette().disabled; },
  get purple(): string { return palette().purple; },
  get blue(): string { return palette().blue; },
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 26,
};

export const shadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
