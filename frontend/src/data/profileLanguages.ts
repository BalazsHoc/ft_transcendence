export const PROFILE_LANGUAGE_CODES = [
  "en",
  "de",
  "ua",
  "ru",
  "fr",
  "es",
  "it",
  "pl",
  "tr",
  "hu",
] as const;

export type ProfileLanguageCode = (typeof PROFILE_LANGUAGE_CODES)[number];
