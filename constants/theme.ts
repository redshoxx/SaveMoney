import { Appearance } from 'react-native';

const light = {
  background: '#F4F7F5',
  surface: '#FFFFFF',
  surfaceMuted: '#EAF0EC',
  text: '#101713',
  textMuted: '#68736C',
  primary: '#2D9A5B',
  primaryDark: '#1F7443',
  primarySoft: '#E2F5E9',
  border: '#D9E3DC',
  success: '#2D9A5B',
  warning: '#B77A1E',
  danger: '#CE5259',
  dangerSoft: '#FBEAEC',
  disabled: '#D2DAD5',
  purple: '#7763C5',
  blue: '#4D83C7',
  cyan: '#329A9D',
  magenta: '#A05DB5',
  orange: '#C8752B',
  glow: 'rgba(45,154,91,0.14)',
} as const;

const dark = {
  background: '#0A0F0C',
  surface: '#141A16',
  surfaceMuted: '#1D2520',
  text: '#F3F7F4',
  textMuted: '#98A49C',
  primary: '#58C77D',
  primaryDark: '#83E3A1',
  primarySoft: '#153522',
  border: '#28322B',
  success: '#58C77D',
  warning: '#E0AD48',
  danger: '#EB686E',
  dangerSoft: '#351E21',
  disabled: '#333C36',
  purple: '#9381DB',
  blue: '#669BDD',
  cyan: '#57B8BA',
  magenta: '#B879C8',
  orange: '#E09245',
  glow: 'rgba(88,199,125,0.18)',
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

export const accents = ['#2D9A5B', '#4D83C7', '#329A9D', '#7763C5', '#C8752B'] as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
};

export const shadow = '0 5px 16px rgba(0, 0, 0, 0.12)';
