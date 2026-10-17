import { fireEvent, screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { UserStats } from "@/features/dashboard/components/user-stats";
import { expectNoAxeViolations } from "@test/axe";
import { renderWithProviders } from "@test/render";
import { server } from "@test/server";

const URL = "http://api.test/v1/admin/stats/users";

const signupsByDay = Array.from({ length: 30 }, (_, index) => ({
  date: `2026-09-${String(index + 1).padStart(2, "0")}`,
  count: index % 7,
}));

const STATS = {
  total: 1284,
  newToday: 23,
  new7d: 162,
  active7d: 618,
  blocked: 7,
  withPhonePct: 41.5,
  signupsByDay,
};

describe("AC13 · dashboard", () => {
  it("shows the six tiles and the 30-day sign-ups chart with a table fallback", async () => {
    server.use(http.get(URL, () => HttpResponse.json(STATS)));
    const { container } = renderWithProviders(<UserStats />);

    expect(await screen.findByTestId("admin.stat-total")).toHaveTextContent("1,284");
    expect(screen.getByTestId("admin.stat-new-today")).toHaveTextContent("23");
    expect(screen.getByTestId("admin.stat-new-7d")).toHaveTextContent("162");
    expect(screen.getByTestId("admin.stat-active-7d")).toHaveTextContent("618");
    expect(screen.getByTestId("admin.stat-active-7d")).toHaveTextContent("48% of users");
    expect(screen.getByTestId("admin.stat-blocked")).toHaveTextContent("7");
    expect(screen.getByTestId("admin.stat-with-phone")).toHaveTextContent("41.5%");

    const chart = screen.getByTestId("admin.signups-chart");
    expect(within(chart).getByRole("img", { name: "Sign-ups per day, last 30 days" })).toBeInTheDocument();
    const table = within(chart).getByRole("table", { name: "Sign-ups per day, last 30 days" });
    expect(within(table).getAllByRole("row")).toHaveLength(31);
    await expectNoAxeViolations(container);
  });

  it("shows loading placeholders while the numbers load", () => {
    server.use(http.get(URL, async () => new Promise(() => undefined)));
    renderWithProviders(<UserStats />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading user numbers…");
  });

  it("shows an error with a working retry", async () => {
    server.use(
      http.get(URL, () => HttpResponse.json({ statusCode: 500, code: "INTERNAL", message: "x", requestId: "r" }, { status: 500 })),
    );
    renderWithProviders(<UserStats />);

    expect(await screen.findByRole("alert")).toHaveTextContent("User numbers could not be loaded");

    server.use(http.get(URL, () => HttpResponse.json(STATS)));
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByTestId("admin.stat-total")).toBeInTheDocument();
  });

  it("shows an empty state when there are no users", async () => {
    server.use(
      http.get(URL, () =>
        HttpResponse.json({ ...STATS, total: 0, newToday: 0, new7d: 0, active7d: 0, blocked: 0, withPhonePct: 0 }),
      ),
    );
    renderWithProviders(<UserStats />);

    expect(await screen.findByText("No users yet")).toBeInTheDocument();
    expect(screen.queryByTestId("admin.stat-total")).not.toBeInTheDocument();
  });
});
