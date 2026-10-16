import type { Locale } from "./config";

import enCommon from "./messages/en/common.json";
import enDashboard from "./messages/en/dashboard.json";
import ruCommon from "./messages/ru/common.json";
import ruDashboard from "./messages/ru/dashboard.json";
import uzCommon from "./messages/uz/common.json";
import uzDashboard from "./messages/uz/dashboard.json";

export type Messages = {
  common: typeof enCommon;
  dashboard: typeof enDashboard;
};

/** One JSON file per feature namespace; English is the reference shape. */
export const messagesByLocale: Record<Locale, Messages> = {
  en: { common: enCommon, dashboard: enDashboard },
  ru: { common: ruCommon, dashboard: ruDashboard },
  uz: { common: uzCommon, dashboard: uzDashboard },
};
