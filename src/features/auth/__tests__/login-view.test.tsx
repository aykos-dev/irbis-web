import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { AuthProvider } from "@/features/auth/components/auth-provider";
import { LoginView } from "@/features/auth/components/login-view";
import { getAccessToken, setAccessToken } from "@/shared/api/auth";
import { expectNoAxeViolations } from "@test/axe";
import { currentUrl } from "@test/navigation-mock";
import { renderWithProviders } from "@test/render";
import { server } from "@test/server";
import { ADMIN_ME } from "@test/session";

const API = "http://api.test";

function error(status: number, code: string, extra: Record<string, unknown> = {}) {
  return HttpResponse.json({ statusCode: status, code, message: "x", requestId: "r", ...extra }, { status });
}

function renderLogin() {
  server.use(http.post(`${API}/v1/admin/auth/refresh`, () => error(401, "REFRESH_INVALID")));
  const view = renderWithProviders(
    <AuthProvider>
      <LoginView />
    </AuthProvider>,
  );
  return view;
}

async function submit(username: string, password: string) {
  fireEvent.change(await screen.findByTestId("admin.login-username"), { target: { value: username } });
  fireEvent.change(screen.getByTestId("admin.login-password"), { target: { value: password } });
  fireEvent.click(screen.getByTestId("admin.login-submit"));
}

describe("AC12 · admin log-in", () => {
  it("logs an admin in, keeps the token in memory and goes to the dashboard", async () => {
    setAccessToken(null);
    renderLogin();
    server.use(
      http.post(`${API}/v1/admin/auth/log-in`, async ({ request }) => {
        expect(await request.json()).toEqual({ username: "admin_one", password: "secret-pass" });
        return HttpResponse.json({ accessToken: "access-1", expiresIn: 900, me: ADMIN_ME });
      }),
    );

    await submit("admin_one", "secret-pass");

    await waitFor(() => expect(currentUrl().pathname).toBe("/"));
    expect(getAccessToken()).toBe("access-1");
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });

  it("shows one generic message for wrong credentials", async () => {
    renderLogin();
    server.use(http.post(`${API}/v1/admin/auth/log-in`, () => error(401, "INVALID_CREDENTIALS")));

    await submit("admin_one", "wrong");

    expect(await screen.findByTestId("admin.login-error")).toHaveTextContent("Username or password is wrong.");
    expect(currentUrl().pathname).toBe("/");
  });

  it("says how long the account is locked", async () => {
    renderLogin();
    server.use(http.post(`${API}/v1/admin/auth/log-in`, () => error(423, "ACCOUNT_LOCKED", { retryAfterSec: 840 })));

    await submit("admin_one", "wrong");

    expect(await screen.findByTestId("admin.login-error")).toHaveTextContent("locked for 14 minutes");
  });

  it("tells a non-admin they have no admin access", async () => {
    renderLogin();
    server.use(http.post(`${API}/v1/admin/auth/log-in`, () => error(403, "NOT_ADMIN")));

    await submit("guest_1", "secret-pass");

    expect(await screen.findByTestId("admin.login-error")).toHaveTextContent("This account has no admin access.");
  });

  it("asks for both fields before sending anything", async () => {
    renderLogin();
    fireEvent.click(await screen.findByTestId("admin.login-submit"));

    expect(await screen.findAllByText("This field is required.")).toHaveLength(2);
  });

  it("has no accessibility violations", async () => {
    const { container } = renderLogin();
    await screen.findByTestId("admin.login-form");
    await expectNoAxeViolations(container);
  });
});
