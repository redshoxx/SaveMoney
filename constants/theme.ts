import { Appearance } from 'react-native';

const light = {
  background: '#F5F6F7',
  surface: '#FFFFFF',
  surfaceMuted: '#ECEFF2',
  text: '#171A1F',
  textMuted: '#69717D',
  primary: '#59687C',
  primaryDark: '#3F4B5C',
  primarySoft: '#E4E8ED',
  border: '#DEE2E7',
  success: '#64776A',
  warning: '#9A754A',
  danger: '#A95858',
  dangerSoft: '#F5E8E8',
  disabled: '#D7DBE0',
  purple: '#756D86',
  blue: '#64758C',
} as const;

const dark = {
  background: '#0D0F12',
  surface: '#15181D',
  surfaceMuted: '#1D2127',
  text: '#F3F4F6',
  textMuted: '#989EA8',
  primary: '#718096',
  primaryDark: '#C2CAD5',
  primarySoft: '#252B34',
  border: '#2A2F37',
  success: '#93A49A',
  warning: '#C29B68',
  danger: '#DE8585',
  dangerSoft: '#352326',
  disabled: '#343941',
  purple: '#9A91AA',
  blue: '#8A9CB4',
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
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
};

export const shadow = '0 6px 18px rgba(0, 0, 0, 0.08)';
