import type { SavingAction } from '@/types/models';

export const savingActions: SavingAction[] = [
  { id: 'coffee-home', title: 'Kaffee zuhause', subtitle: 'Coffee-to-go ausgelassen', amount: 4, icon: 'cup.and.saucer.fill', color: '#B66A15' },
  { id: 'no-delivery', title: 'Kein Lieferdienst', subtitle: 'Heute selbst gekocht', amount: 15, icon: 'fork.knife', color: '#B25A4A' },
  { id: 'no-energy', title: 'Kein Energy Drink', subtitle: 'Kleine Ausgabe vermieden', amount: 3, icon: 'bolt.slash.fill', color: '#3976B8' },
  { id: 'home-cooked', title: 'Zuhause gekocht', subtitle: 'Mittagessen selbst gemacht', amount: 10, icon: 'takeoutbag.and.cup.and.straw.fill', color: '#287D58' },
  { id: 'no-impulse', title: 'Kein Impulskauf', subtitle: 'Nicht spontan gekauft', amount: 20, icon: 'hand.raised.fill', color: '#7652B7' },
  { id: 'bike', title: 'Fahrrad statt Auto', subtitle: 'Fahrtkosten eingespart', amount: 5, icon: 'bicycle', color: '#2B7B86' },
];
