import type { ReactElement } from "react";

import { SessionContext } from "@/shared/api/session";
import type { MeResponseDto } from "@/shared/api/generated/model";

import { renderWithProviders } from "./render";

export const ADMIN_ME: MeResponseDto = {
  id: "00000000-0000-4000-8000-000000000001",
  username: "admin_one",
  locale: "en",
  experience: null,
  interests: [],
  role: "admin",
  hasRecoveryPhone: false,
  recoveryPhonePending: false,
  createdAt: "2026-10-01T08:00:00.000Z",
};

/** Renders a feature as a signed-in admin without running the refresh bootstrap. */
export function renderAsAdmin(ui: ReactElement, me: MeResponseDto = ADMIN_ME) {
  return renderWithProviders(
    <SessionContext
      value={{ status: "authenticated", me, startSession: () => undefined, signOut: () => Promise.resolve() }}
    >
      {ui}
    </SessionContext>,
  );
}
