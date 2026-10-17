import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { SESSION_HINT_COOKIE } from "@/features/auth/session-hint";
import { proxy } from "@/proxy";

function request(path: string, withHint: boolean) {
  return new NextRequest(`http://localhost:3001${path}`, {
    headers: withHint ? { cookie: `${SESSION_HINT_COOKIE}=1` } : {},
  });
}

describe("proxy (UX-only redirect)", () => {
  it("sends visitors without a session hint from the admin area to /login", () => {
    const response = proxy(request("/users", false));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3001/login");
  });

  it("lets visitors with a hint through", () => {
    expect(proxy(request("/users", true)).headers.get("location")).toBeNull();
  });

  it("lets anonymous visitors reach /login", () => {
    expect(proxy(request("/login", false)).headers.get("location")).toBeNull();
  });

  it("sends a signed-in visitor away from /login to the dashboard", () => {
    expect(proxy(request("/login", true)).headers.get("location")).toBe("http://localhost:3001/");
  });
});
