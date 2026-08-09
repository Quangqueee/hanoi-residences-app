/**
 * React Navigation param lists for typed routes.
 * Expo Router file routes mirror these names.
 */

export type AuthStackParamList = {
  login: undefined;
  signup: undefined;
};

export type MainTabParamList = {
  index: undefined;
  explore: undefined;
  bookings: undefined;
  notifications: undefined;
  profile: undefined;
};

export type RootStackParamList = {
  '(tabs)': undefined;
  '(auth)': undefined;
  'apartment/[id]': { id: string };
  'booking/new': { apartmentId?: string } | undefined;
};
