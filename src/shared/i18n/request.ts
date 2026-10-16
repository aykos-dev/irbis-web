import { getRequestConfig } from "next-intl/server";

import { defaultLocale } from "./config";
import { messagesByLocale } from "./messages";

export default getRequestConfig(async () => {
  const locale = defaultLocale;
  return {
    locale,
    messages: messagesByLocale[locale],
    timeZone: "Asia/Tashkent",
  };
});
