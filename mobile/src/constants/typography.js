import { Platform } from 'react-native';

export const FontFamily = {
  regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
  medium: Platform.OS === 'ios' ? 'System' : 'Roboto',
  bold: Platform.OS === 'ios' ? 'System' : 'Roboto',
};

export const FontSize = {
  display1: 32,
  display2: 28,
  h1: 24,
  h2: 20,
  h3: 18,
  bodyLarge: 16,
  body: 14,
  caption: 12,
  overline: 11,
};

export const FontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const LineHeight = {
  display: 1.2,
  heading: 1.3,
  body: 1.5,
};
