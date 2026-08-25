import { Appearance } from 'react-native';

const light = {
  background: '#F4F6F2',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF2EC',
  text: '#172018',
  textMuted: '#6E796F',
  primary: '#1D7A46',
  primaryDark: '#145C34',
  primarySoft: '#DDEFE4',
  border: '#E3E8E1',
  success: '#1D7A46',
  warning: '#B66A15',
  danger: '#B43E3E',
  dangerSoft: '#FDE8E8',
  disabled: '#D9DEDA',
  purple: '#7652B7',
  blue: '#3976B8',
};

const dark = {
  background: '#0D120F',
  surface: '#161D18',
  surfaceMuted: '#202922',
  text: '#F2F6F3',
  textMuted: '#98A49B',
  primary: '#4CC17A',
  primaryDark: '#8DE0AB',
  primarySoft: '#203B29',
  border: '#2A352D',
  success: '#4CC17A',
  warning: '#E2A050',
  danger: '#EF7B7B',
  dangerSoft: '#3A2224',
  disabled: '#364039',
  purple: '#A98BE3',
  blue: '#76AAE4',
};

function palette() {
  return Appearance.getColorScheme() === 'dark' ? dark : light;
}

export const colors = {
  get background() { return palette().background; },
  get surface() { return palette().surface; },
  get surfaceMuted() { return palette().surfaceMuted; },
  get text() { return palette().text; },
  get textMuted() { return palette().textMuted; },
  get primary() { return palette().primary; },
  get primaryDark() { return palette().primaryDark; },
  get primarySoft() { return palette().primarySoft; },
  get border() { return palette().border; },
  get success() { return palette().success; },
  get warning() { return palette().warning; },
  get danger() { return palette().danger; },
  get dangerSoft() { return palette().dangerSoft; },
  get disabled() { return palette().disabled; },
  get purple() { return palette().purple; },
  get blue() { return palette().blue; },
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
};

export const shadow = '0 10px 30px rgba(0, 0, 0, 0.10)';
