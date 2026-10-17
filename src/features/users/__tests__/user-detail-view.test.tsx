import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { UserDetailView } from "@/features/users/components/user-detail-view";
import { expectNoAxeViolations } from "@test/axe";
import { renderAsAdmin, ADMIN_ME } from "@test/session";
import { server } from "@test/server";

const API = "http://api.test/v1/admin/users";
const USER_ID = "00000000-0000-4000-8000-000000000202";

type Detail = Record<string, unknown>;

function detail(overrides: Detail = {}): Detail {
  return {
    id: USER_ID,
    username: "guest_7",
    role: "user",
    status: "active",
    joinedAt: "2026-10-15T09:10:00.000Z",
    lastActiveAt: "2026-10-16T09:10:00.000Z",
    recoveryPhoneMasked: "+998 •• ••• •• 08",
    locale: "uz",
    recoveryPhoneVerified: true,
    blockedAt: null,
    blockReasonCode: null,
    lockedForSec: null,
    sessionsCount: 2,
    level: null,
    ...overrides,
  };
}

const AUDIT = {
  items: [
    {
      id: "a2",
      admin: { id: ADMIN_ME.id, username: "admin_one" },
      action: "block",
      reasonCode: "spam",
      note: "Posted ads in chat",
      detail: null,
      at: "2026-10-17T09:10:00.000Z",
    },
    {
      id: "a1",
      admin: { id: "00000000-0000-4000-8000-000000000009", username: "admin_two" },
      action: "set_password",
      reasonCode: null,
      note: "Lost access, verified by support",
      detail: null,
      at: "2026-10-16T09:10:00.000Z",
    },
  ],
  nextCursor: null,
};

/** Serves a mutable user so a mutation followed by the refetch shows the new state. */
function serveUser(initial: Detail = detail(), audit: Record<string, unknown> = AUDIT) {
  const state = { user: initial, audit };
  server.use(
    http.get(`${API}/${USER_ID}`, () => HttpResponse.json(state.user)),
    http.get(`${API}/${USER_ID}/audit`, () => HttpResponse.json(state.audit)),
  );
  return state;
}

function apiError(status: number, code: string, extra: Record<string, unknown> = {}) {
  return HttpResponse.json({ statusCode: status, code, message: "x", requestId: "r", ...extra }, { status });
}

async function openAction(name: string) {
  fireEvent.click(await screen.findByTestId(`admin.user-action-${name}`));
  return screen.findByRole("dialog");
}

describe("AC15 · user detail", () => {
  it("shows the account facts, masked phone, actions and the audit log newest first", async () => {
    serveUser(detail({ status: "blocked", blockReasonCode: "spam", sessionsCount: 0 }));
    const { container } = renderAsAdmin(<UserDetailView userId={USER_ID} />);

    expect(await screen.findByRole("heading", { level: 1, name: "guest_7" })).toBeInTheDocument();
    expect(screen.getByText("Blocked · Spam or advertising")).toBeInTheDocument();
    expect(screen.getByTestId("admin.user-phone")).toHaveTextContent("+998 •• ••• •• 08 · verified");
    expect(screen.getByTestId("admin.user-sessions")).toHaveTextContent("0");
    expect(screen.getByTestId("admin.user-action-unblock")).toBeInTheDocument();
    expect(screen.queryByTestId("admin.user-action-block")).not.toBeInTheDocument();

    const audit = await screen.findByTestId("admin.audit-table");
    const rows = within(audit).getAllByRole("row");
    expect(rows[1]).toHaveTextContent("admin_one");
    expect(rows[1]).toHaveTextContent("Blocked");
    expect(rows[1]).toHaveTextContent("Spam or advertising");
    expect(rows[2]).toHaveTextContent("Changed password");
    await expectNoAxeViolations(container);
  });

  it("blocks with a required reason and note, toasts, and refreshes the page", async () => {
    const state = serveUser();
    let body: unknown;
    server.use(
      http.post(`${API}/${USER_ID}/block`, async ({ request }) => {
        body = await request.json();
        state.user = detail({ status: "blocked", blockReasonCode: "harassment", sessionsCount: 0 });
        return HttpResponse.json(state.user);
      }),
    );
    renderAsAdmin(<UserDetailView userId={USER_ID} />);

    const dialog = await openAction("block");
    fireEvent.click(within(dialog).getByTestId("admin.dialog-confirm"));
    expect(await within(dialog).findByText("Write a reason.")).toBeInTheDocument();
    expect(body).toBeUndefined();

    fireEvent.change(within(dialog).getByTestId("admin.dialog-reason"), { target: { value: "harassment" } });
    fireEvent.change(within(dialog).getByTestId("admin.dialog-note"), { target: { value: "Targeted another user" } });
    fireEvent.click(within(dialog).getByTestId("admin.dialog-confirm"));

    expect(await screen.findByText("guest_7 is blocked.")).toBeInTheDocument();
    expect(body).toEqual({ reasonCode: "harassment", note: "Targeted another user" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(await screen.findByText("Blocked · Harassment or hate")).toBeInTheDocument();
    expect(screen.getByTestId("admin.user-action-unblock")).toBeInTheDocument();
  });

  it("unblocks with a reason", async () => {
    const state = serveUser(detail({ status: "blocked", blockReasonCode: "spam", sessionsCount: 0 }));
    let body: unknown;
    server.use(
      http.post(`${API}/${USER_ID}/unblock`, async ({ request }) => {
        body = await request.json();
        state.user = detail();
        return HttpResponse.json(state.user);
      }),
    );
    renderAsAdmin(<UserDetailView userId={USER_ID} />);

    const dialog = await openAction("unblock");
    fireEvent.change(within(dialog).getByTestId("admin.dialog-reason"), { target: { value: "Appeal accepted" } });
    fireEvent.click(within(dialog).getByTestId("admin.dialog-confirm"));

    expect(await screen.findByText("guest_7 is unblocked.")).toBeInTheDocument();
    expect(body).toEqual({ note: "Appeal accepted" });
    expect(await screen.findByTestId("admin.user-action-block")).toBeInTheDocument();
  });

  it("sets a password with a reason and maps PASSWORD_WEAK onto the field", async () => {
    serveUser();
    let calls = 0;
    server.use(
      http.put(`${API}/${USER_ID}/password`, async ({ request }) => {
        calls += 1;
        const { newPassword } = (await request.json()) as { newPassword: string };
        return newPassword === "123456" ? apiError(422, "PASSWORD_WEAK") : new HttpResponse(null, { status: 204 });
      }),
    );
    renderAsAdmin(<UserDetailView userId={USER_ID} />);

    const dialog = await openAction("password");
    fireEvent.change(within(dialog).getByTestId("admin.dialog-password"), { target: { value: "123456" } });
    fireEvent.change(within(dialog).getByTestId("admin.dialog-reason"), { target: { value: "Verified by support" } });
    fireEvent.click(within(dialog).getByTestId("admin.dialog-confirm"));
    expect(await within(dialog).findByText(/password is too weak/i)).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.change(within(dialog).getByTestId("admin.dialog-password"), { target: { value: "mountain-sky-42" } });
    fireEvent.click(within(dialog).getByTestId("admin.dialog-confirm"));
    expect(await screen.findByText("Password changed for guest_7.")).toBeInTheDocument();
    expect(calls).toBe(2);
  });

  it("checks the password length before calling the API", async () => {
    serveUser();
    renderAsAdmin(<UserDetailView userId={USER_ID} />);

    const dialog = await openAction("password");
    fireEvent.change(within(dialog).getByTestId("admin.dialog-password"), { target: { value: "abc" } });
    fireEvent.change(within(dialog).getByTestId("admin.dialog-reason"), { target: { value: "Reason" } });
    fireEvent.click(within(dialog).getByTestId("admin.dialog-confirm"));

    expect(await within(dialog).findByText("Use 6 to 64 characters.")).toBeInTheDocument();
  });

  it("edits the recovery phone and sends it without spaces", async () => {
    serveUser();
    let body: unknown;
    server.use(
      http.put(`${API}/${USER_ID}/recovery-phone`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(detail());
      }),
    );
    renderAsAdmin(<UserDetailView userId={USER_ID} />);

    const dialog = await openAction("phone");
    fireEvent.change(within(dialog).getByTestId("admin.dialog-phone"), { target: { value: "+998 90 000 00 00" } });
    fireEvent.change(within(dialog).getByTestId("admin.dialog-reason"), { target: { value: "Support ticket" } });
    fireEvent.click(within(dialog).getByTestId("admin.dialog-confirm"));

    expect(await screen.findByText("Recovery phone updated for guest_7.")).toBeInTheDocument();
    expect(body).toEqual({ phone: "+998900000000", note: "Support ticket" });
  });

  it("rejects a malformed phone on the field", async () => {
    serveUser();
    renderAsAdmin(<UserDetailView userId={USER_ID} />);

    const dialog = await openAction("phone");
    fireEvent.change(within(dialog).getByTestId("admin.dialog-phone"), { target: { value: "12345" } });
    fireEvent.change(within(dialog).getByTestId("admin.dialog-reason"), { target: { value: "Support ticket" } });
    fireEvent.click(within(dialog).getByTestId("admin.dialog-confirm"));

    expect(await within(dialog).findByText("Use +998 and 9 digits.")).toBeInTheDocument();
  });

  it("changes the role of another user", async () => {
    serveUser();
    let body: unknown;
    server.use(
      http.put(`${API}/${USER_ID}/role`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(detail({ role: "admin" }));
      }),
    );
    renderAsAdmin(<UserDetailView userId={USER_ID} />);

    const dialog = await openAction("role");
    expect(within(dialog).getByTestId("admin.dialog-role")).toHaveValue("admin");
    fireEvent.change(within(dialog).getByTestId("admin.dialog-reason"), { target: { value: "New moderator lead" } });
    fireEvent.click(within(dialog).getByTestId("admin.dialog-confirm"));

    expect(await screen.findByText("Role changed for guest_7.")).toBeInTheDocument();
    expect(body).toEqual({ role: "admin", note: "New moderator lead" });
  });

  it("hides change role and block for yourself", async () => {
    serveUser(detail({ id: USER_ID, username: "admin_one", role: "admin" }));
    renderAsAdmin(<UserDetailView userId={USER_ID} />, { ...ADMIN_ME, id: USER_ID });

    await screen.findByRole("heading", { level: 1, name: "admin_one" });
    expect(screen.queryByTestId("admin.user-action-role")).not.toBeInTheDocument();
    expect(screen.queryByTestId("admin.user-action-block")).not.toBeInTheDocument();
    expect(screen.getByTestId("admin.user-action-password")).toBeInTheDocument();
  });

  it("shows the server error when the API refuses a role change anyway", async () => {
    serveUser();
    server.use(http.put(`${API}/${USER_ID}/role`, () => apiError(403, "CANNOT_CHANGE_OWN_ROLE")));
    renderAsAdmin(<UserDetailView userId={USER_ID} />);

    const dialog = await openAction("role");
    fireEvent.change(within(dialog).getByTestId("admin.dialog-reason"), { target: { value: "Test" } });
    fireEvent.click(within(dialog).getByTestId("admin.dialog-confirm"));

    expect(await within(dialog).findByTestId("admin.dialog-error")).toHaveTextContent("You can't change your own role.");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("explains ALREADY_BLOCKED instead of failing silently", async () => {
    serveUser();
    server.use(http.post(`${API}/${USER_ID}/block`, () => apiError(409, "ALREADY_BLOCKED")));
    renderAsAdmin(<UserDetailView userId={USER_ID} />);

    const dialog = await openAction("block");
    fireEvent.change(within(dialog).getByTestId("admin.dialog-note"), { target: { value: "Spam" } });
    fireEvent.click(within(dialog).getByTestId("admin.dialog-confirm"));

    expect(await within(dialog).findByTestId("admin.dialog-error")).toHaveTextContent("already blocked");
  });

  it("shows not-found for an unknown user", async () => {
    server.use(http.get(`${API}/${USER_ID}`, () => apiError(404, "NOT_FOUND")));
    renderAsAdmin(<UserDetailView userId={USER_ID} />);

    expect(await screen.findByText("User not found")).toBeInTheDocument();
  });

  it("shows an error with retry when the user cannot be loaded", async () => {
    server.use(http.get(`${API}/${USER_ID}`, () => apiError(500, "INTERNAL")));
    renderAsAdmin(<UserDetailView userId={USER_ID} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("User could not be loaded");

    serveUser();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByRole("heading", { level: 1, name: "guest_7" })).toBeInTheDocument();
  });

  it("shows an empty audit log", async () => {
    serveUser(detail(), { items: [], nextCursor: null });
    renderAsAdmin(<UserDetailView userId={USER_ID} />);

    expect(await screen.findByText("No actions yet")).toBeInTheDocument();
    expect(screen.queryByTestId("admin.audit-table")).not.toBeInTheDocument();
  });
});
