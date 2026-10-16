import { onlineManager } from "@tanstack/react-query";
import { act, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import { OfflineBanner } from "@/shared/components/layout/offline-banner";
import { expectNoAxeViolations } from "@test/axe";
import { renderWithProviders } from "@test/render";

describe("DashboardView", () => {
  it("renders the dashboard heading inside the provider tree", async () => {
    const { container } = renderWithProviders(<DashboardView />);

    expect(screen.getByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();
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
