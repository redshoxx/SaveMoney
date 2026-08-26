import { Appearance } from 'react-native';

const light = {
  background: '#F6F7FF',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF0FA',
  text: '#10131D',
  textMuted: '#6F7890',
  primary: '#6F47FF',
  primaryDark: '#5637D8',
  primarySoft: '#ECE7FF',
  border: '#DDE2F0',
  success: '#16A56C',
  warning: '#E78A21',
  danger: '#D95368',
  dangerSoft: '#FDE8EC',
  disabled: '#D8DDEA',
  purple: '#A947FF',
  blue: '#3478FF',
  cyan: '#00AFC7',
  magenta: '#CB42F5',
  orange: '#F49A2F',
  glow: 'rgba(111,71,255,0.24)',
} as const;

const dark = {
  background: '#050814',
  surface: '#0B1020',
  surfaceMuted: '#12192A',
  text: '#F8F9FF',
  textMuted: '#8E98B0',
  primary: '#7B4DFF',
  primaryDark: '#C7B7FF',
  primarySoft: '#21154C',
  border: '#222B42',
  success: '#33D69A',
  warning: '#FFB04A',
  danger: '#FF6B80',
  dangerSoft: '#351523',
  disabled: '#2A3144',
  purple: '#C34CFF',
  blue: '#3B82FF',
  cyan: '#12D8F4',
  magenta: '#F04DFF',
  orange: '#FF9D2E',
  glow: 'rgba(123,77,255,0.38)',
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
  get cyan(): string { return palette().cyan; },
  get magenta(): string { return palette().magenta; },
  get orange(): string { return palette().orange; },
  get glow(): string { return palette().glow; },
};

export const accents = ['#7B4DFF', '#3B82FF', '#12D8F4', '#C34CFF', '#FF9D2E'] as const;

export const radius = {
  sm: 11,
  md: 15,
  lg: 20,
  xl: 26,
};

export const shadow = '0 10px 28px rgba(0, 0, 0, 0.22)';
