import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LoginView } from "@/features/auth/components/login-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.login");
  return { title: t("pageTitle") };
}

export default function LoginPage() {
  return <LoginView />;
}
