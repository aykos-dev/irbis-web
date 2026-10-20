import type { L10nDto } from "@/shared/api/generated/model";
import { ADMIN_TIME_ZONE } from "@/shared/lib/format";

/** The title in the admin UI locale (en/ru/uz); Uzbek when the locale is something else. */
export function localTitle(title: L10nDto, locale: string): string {
  return locale === "en" || locale === "ru" || locale === "uz" ? title[locale] : title.uz;
}

const PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: ADMIN_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** An ISO instant as "dd.MM.yyyy HH:mm" in Asia/Tashkent. */
export function formatTashkent(iso: string): string {
  const part = Object.fromEntries(PARTS.formatToParts(new Date(iso)).map(({ type, value }) => [type, value]));
  return `${part.day}.${part.month}.${part.year} ${part.hour}:${part.minute}`;
}

/** The id list with the item at `index` swapped one step up (-1) or down (+1); null at the edges. */
export function moveId(ids: readonly string[], index: number, step: -1 | 1): string[] | null {
  const target = index + step;
  const current = ids[index];
  const other = ids[target];
  if (current === undefined || other === undefined) return null;
  const next = [...ids];
  next[index] = other;
  next[target] = current;
  return next;
}
