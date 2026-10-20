import type { Locale } from "./config";

import enAuth from "./messages/en/auth.json";
import enCommon from "./messages/en/common.json";
import enConditions from "./messages/en/conditions.json";
import enDashboard from "./messages/en/dashboard.json";
import enHealth from "./messages/en/health.json";
import enLessonsAdmin from "./messages/en/lessonsAdmin.json";
import enUsers from "./messages/en/users.json";
import ruAuth from "./messages/ru/auth.json";
import ruCommon from "./messages/ru/common.json";
import ruConditions from "./messages/ru/conditions.json";
import ruDashboard from "./messages/ru/dashboard.json";
import ruHealth from "./messages/ru/health.json";
import ruLessonsAdmin from "./messages/ru/lessonsAdmin.json";
import ruUsers from "./messages/ru/users.json";
import uzAuth from "./messages/uz/auth.json";
import uzCommon from "./messages/uz/common.json";
import uzConditions from "./messages/uz/conditions.json";
import uzDashboard from "./messages/uz/dashboard.json";
import uzHealth from "./messages/uz/health.json";
import uzLessonsAdmin from "./messages/uz/lessonsAdmin.json";
import uzUsers from "./messages/uz/users.json";

export type Messages = {
  auth: typeof enAuth;
  common: typeof enCommon;
  conditions: typeof enConditions;
  dashboard: typeof enDashboard;
  health: typeof enHealth;
  lessonsAdmin: typeof enLessonsAdmin;
  users: typeof enUsers;
};

/** One JSON file per feature namespace; English is the reference shape. */
export const messagesByLocale: Record<Locale, Messages> = {
  en: { auth: enAuth, common: enCommon, conditions: enConditions, dashboard: enDashboard, health: enHealth, lessonsAdmin: enLessonsAdmin, users: enUsers },
  ru: { auth: ruAuth, common: ruCommon, conditions: ruConditions, dashboard: ruDashboard, health: ruHealth, lessonsAdmin: ruLessonsAdmin, users: ruUsers },
  uz: { auth: uzAuth, common: uzCommon, conditions: uzConditions, dashboard: uzDashboard, health: uzHealth, lessonsAdmin: uzLessonsAdmin, users: uzUsers },
};
