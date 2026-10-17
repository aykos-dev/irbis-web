import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";

import { registerSessionHandlers, getAccessToken, setAccessToken } from "@/shared/api/auth";
import { adminUserStats } from "@/shared/api/generated/endpoints";
import { server } from "@test/server";

const API = "http://api.test";
const STATS = { total: 1, newToday: 0, new7d: 0, active7d: 0, blocked: 0, withPhonePct: 0, signupsByDay: [] };

afterEach(() => {
  registerSessionHandlers(null);
  setAccessToken(null);
});

function refresher(onCall: () => void) {
  return async () => {
    onCall();
    const response = await fetch(`${API}/v1/admin/auth/refresh`, { method: "POST", credentials: "include" });
    const body = (await response.json()) as { accessToken: string };
    return body.accessToken;
  };
}

describe("admin session refresh (AC9-style rotation for web)", () => {
  it("refreshes once on 401 and replays the request with the new token", async () => {
    setAccessToken("expired");
    const seen: (string | null)[] = [];
    server.use(
      http.get(`${API}/v1/admin/stats/users`, ({ request }) => {
        seen.push(request.headers.get("authorization"));
        return request.headers.get("authorization") === "Bearer fresh"
          ? HttpResponse.json(STATS)
          : HttpResponse.json({ statusCode: 401, code: "UNAUTHORIZED", message: "x", requestId: "r" }, { status: 401 });
      }),
      http.post(`${API}/v1/admin/auth/refresh`, () => HttpResponse.json({ accessToken: "fresh", expiresIn: 900 })),
    );
    const refresh = vi.fn();
    registerSessionHandlers({ refresh: refresher(refresh), onExpired: vi.fn() });

    await expect(adminUserStats()).resolves.toMatchObject({ total: 1 });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(seen).toEqual(["Bearer expired", "Bearer fresh"]);
    expect(getAccessToken()).toBe("fresh");
  });

  it("shares one refresh between concurrent 401s (single-flight)", async () => {
    setAccessToken("expired");
    server.use(
      http.get(`${API}/v1/admin/stats/users`, ({ request }) =>
        request.headers.get("authorization") === "Bearer fresh"
          ? HttpResponse.json(STATS)
          : HttpResponse.json({ statusCode: 401, code: "UNAUTHORIZED", message: "x", requestId: "r" }, { status: 401 }),
      ),
      http.post(`${API}/v1/admin/auth/refresh`, () => HttpResponse.json({ accessToken: "fresh", expiresIn: 900 })),
    );
    const refresh = vi.fn();
    registerSessionHandlers({ refresh: refresher(refresh), onExpired: vi.fn() });

    await Promise.all([adminUserStats(), adminUserStats(), adminUserStats()]);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("ends the session when the refresh itself is rejected", async () => {
    setAccessToken("expired");
    server.use(
      http.get(`${API}/v1/admin/stats/users`, () =>
        HttpResponse.json({ statusCode: 401, code: "UNAUTHORIZED", message: "x", requestId: "r" }, { status: 401 }),
      ),
      http.post(`${API}/v1/admin/auth/refresh`, () =>
        HttpResponse.json({ statusCode: 401, code: "REFRESH_INVALID", message: "x", requestId: "r" }, { status: 401 }),
      ),
    );
    const expired = vi.fn();
    registerSessionHandlers({
      refresh: async () => {
        const { adminAuthRefresh } = await import("@/shared/api/generated/endpoints");
        return (await adminAuthRefresh()).accessToken;
      },
      onExpired: expired,
    });

    await expect(adminUserStats()).rejects.toMatchObject({ status: 401 });
    expect(expired).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
  });
});
