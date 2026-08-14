export const PROFILE_LANGUAGE_CODES = [
  "en",
  "de",
  "ua",
] as const;

export type ProfileLanguageCode = (typeof PROFILE_LANGUAGE_CODES)[number];
