import { Appearance } from 'react-native';

const light = {
  background: '#F3F4F6',
  surface: '#FFFFFF',
  surfaceMuted: '#ECEEF1',
  text: '#111318',
  textMuted: '#6F747C',
  primary: '#7E5CE6',
  primaryDark: '#6546C9',
  primarySoft: '#EEE9FF',
  border: '#DDE0E5',
  success: '#3E9B63',
  warning: '#C77C2D',
  danger: '#D3545D',
  dangerSoft: '#FCEBED',
  disabled: '#D5D8DE',
  purple: '#805EE2',
  blue: '#5D8FD7',
  cyan: '#41AAAD',
  magenta: '#9A63DB',
  orange: '#D27A2D',
  glow: 'rgba(126,92,230,0.16)',
} as const;

const dark = {
  background: '#0C0F12',
  surface: '#171A1F',
  surfaceMuted: '#20242A',
  text: '#F5F6F7',
  textMuted: '#9AA0A8',
  primary: '#875FE4',
  primaryDark: '#A98CF3',
  primarySoft: '#2B2340',
  border: '#2A2F36',
  success: '#49A96C',
  warning: '#D68A39',
  danger: '#EB656D',
  dangerSoft: '#351D21',
  disabled: '#343941',
  purple: '#875FE4',
  blue: '#5D91D8',
  cyan: '#4DB4B7',
  magenta: '#A56CE0',
  orange: '#D77C2D',
  glow: 'rgba(135,95,228,0.20)',
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

export const accents = ['#875FE4', '#5D91D8', '#4DB4B7', '#49A96C', '#D77C2D'] as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
};

export const shadow = '0 6px 18px rgba(0, 0, 0, 0.14)';
