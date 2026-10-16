export const locales = ["uz", "ru", "en"] as const;

export type Locale = (typeof locales)[number];

/** Admin panel default until the language switcher lands. */
export const defaultLocale: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
