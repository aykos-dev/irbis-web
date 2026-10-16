import { onlineManager } from "@tanstack/react-query";
import { act, fireEvent, screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { ApiStatusCard } from "@/features/dashboard/components/api-status-card";
import { expectNoAxeViolations } from "@test/axe";
import { renderWithProviders } from "@test/render";
import { server } from "@test/server";

const HEALTH_URL = "http://api.test/health";
const TIME = "2026-10-17T06:30:00.000Z";

const okBody = { status: "ok", db: "up", version: "0.0.1", time: TIME } as const;
const degradedBody = { status: "degraded", db: "down", version: "0.0.1", time: TIME } as const;

function card() {
  return screen.getByTestId("health.status-card");
}

describe("ApiStatusCard (health AC5, AC6)", () => {
  it("shows a loading skeleton, then API up, database up and the version", async () => {
    server.use(http.get(HEALTH_URL, () => HttpResponse.json(okBody)));
    const { container } = renderWithProviders(<ApiStatusCard />);

    expect(card()).toHaveAttribute("aria-busy", "true");
    expect(within(card()).getByText("Checking the API…")).toBeInTheDocument();

    expect(await screen.findByTestId("health.api-chip")).toHaveTextContent("API is up");
    expect(screen.getByTestId("health.db-chip")).toHaveTextContent("Database is up");
    expect(screen.getByTestId("health.version")).toHaveTextContent("v0.0.1");
    expect(card()).toHaveAttribute("aria-busy", "false");
    await expectNoAxeViolations(container);
  });

  it("renders the degraded body of a 503 as data, not as an error", async () => {
    server.use(http.get(HEALTH_URL, () => HttpResponse.json(degradedBody, { status: 503 })));
    const { container } = renderWithProviders(<ApiStatusCard />);

    expect(await screen.findByTestId("health.db-chip")).toHaveTextContent("Database is down");
    expect(screen.getByTestId("health.api-chip")).toHaveTextContent("API is up");
    expect(screen.getByText(/database is unreachable/i)).toBeInTheDocument();
    expect(screen.queryByText("The API is unreachable")).not.toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it("shows an error with Retry when the API is unreachable, and recovers on retry", async () => {
    let calls = 0;
    server.use(
      http.get(HEALTH_URL, () => {
        calls += 1;
        return calls === 1 ? HttpResponse.error() : HttpResponse.json(okBody);
      }),
    );
    const { container } = renderWithProviders(<ApiStatusCard />);

    expect(await screen.findByText("The API is unreachable")).toBeInTheDocument();
    await expectNoAxeViolations(container);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByTestId("health.api-chip")).toHaveTextContent("API is up");
    expect(calls).toBe(2);
  });

  it("keeps the cached result visible and marks it stale while offline", async () => {
    server.use(http.get(HEALTH_URL, () => HttpResponse.json(okBody)));
    renderWithProviders(<ApiStatusCard />);
    await screen.findByTestId("health.api-chip");

    act(() => onlineManager.setOnline(false));

    expect(screen.getByTestId("health.api-chip")).toHaveTextContent("API is up");
    expect(screen.getByText(/last known status/i)).toBeInTheDocument();

    act(() => onlineManager.setOnline(true));
    expect(screen.queryByText(/last known status/i)).not.toBeInTheDocument();
  });

  it("explains that the check waits for the network when offline with nothing cached", () => {
    act(() => onlineManager.setOnline(false));
    renderWithProviders(<ApiStatusCard />);

    expect(within(card()).getByText(/checked when you reconnect/i)).toBeInTheDocument();
  });
});
