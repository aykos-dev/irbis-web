import { onlineManager } from "@tanstack/react-query";
import { act, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import { OfflineBanner } from "@/shared/components/layout/offline-banner";
import { expectNoAxeViolations } from "@test/axe";
import { renderWithProviders } from "@test/render";
import { server } from "@test/server";

describe("DashboardView", () => {
  it("renders the dashboard heading and the API status card", async () => {
    server.use(
      http.get("http://api.test/health", () =>
        HttpResponse.json({ status: "ok", db: "up", version: "0.0.1", time: "2026-10-17T06:30:00.000Z" }),
      ),
    );
    const { container } = renderWithProviders(<DashboardView />);

    expect(screen.getByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();
    expect(await screen.findByTestId("health.api-chip")).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it("shows a persistent offline banner while the network is down", () => {
    renderWithProviders(<OfflineBanner />);
    expect(screen.queryByText(/you are offline/i)).not.toBeInTheDocument();

    act(() => onlineManager.setOnline(false));
    expect(screen.getByText(/you are offline/i)).toBeInTheDocument();

    act(() => onlineManager.setOnline(true));
    expect(screen.queryByText(/you are offline/i)).not.toBeInTheDocument();
  });
});
