import type { Locale } from "./config";

import enAuth from "./messages/en/auth.json";
import enCommon from "./messages/en/common.json";
import enDashboard from "./messages/en/dashboard.json";
import enHealth from "./messages/en/health.json";
import enUsers from "./messages/en/users.json";
import ruAuth from "./messages/ru/auth.json";
import ruCommon from "./messages/ru/common.json";
import ruDashboard from "./messages/ru/dashboard.json";
import ruHealth from "./messages/ru/health.json";
import ruUsers from "./messages/ru/users.json";
import uzAuth from "./messages/uz/auth.json";
import uzCommon from "./messages/uz/common.json";
import uzDashboard from "./messages/uz/dashboard.json";
import uzHealth from "./messages/uz/health.json";
import uzUsers from "./messages/uz/users.json";

export type Messages = {
  auth: typeof enAuth;
  common: typeof enCommon;
  dashboard: typeof enDashboard;
  health: typeof enHealth;
  users: typeof enUsers;
};

/** One JSON file per feature namespace; English is the reference shape. */
export const messagesByLocale: Record<Locale, Messages> = {
  en: { auth: enAuth, common: enCommon, dashboard: enDashboard, health: enHealth, users: enUsers },
  ru: { auth: ruAuth, common: ruCommon, dashboard: ruDashboard, health: ruHealth, users: ruUsers },
  uz: { auth: uzAuth, common: uzCommon, dashboard: uzDashboard, health: uzHealth, users: uzUsers },
};
