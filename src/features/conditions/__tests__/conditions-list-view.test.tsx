import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { ConditionsListView } from "@/features/conditions/components/conditions-list-view";
import { expectNoAxeViolations } from "@test/axe";
import { currentUrl, setUrl } from "@test/navigation-mock";
import { renderAsAdmin } from "@test/session";
import { server } from "@test/server";

const LIST = "http://api.test/v1/admin/conditions";
const RECOMPUTE = "http://api.test/v1/admin/conditions/recompute";

function row(index: number, overrides: Record<string, unknown> = {}) {
  return {
    placeId: `00000000-0000-4000-8000-0000000003${String(index).padStart(2, "0")}`,
    slug: `place-${index}`,
    name: { uz: `Joy ${index}`, ru: null, en: null },
    type: "peak",
    status: "go",
    source: "forecast",
    computedAt: "2026-10-17T05:00:00.000Z",
    forecastAt: "2026-10-17T04:00:00.000Z",
    activeClosureId: null,
    activeOverrideId: null,
    ...overrides,
  };
}

function serveList(respond: (query: URLSearchParams) => Record<string, unknown>) {
  const queries: URLSearchParams[] = [];
  server.use(
    http.get(LIST, ({ request }) => {
      const query = new URL(request.url).searchParams;
      queries.push(query);
      return HttpResponse.json(respond(query));
    }),
  );
  return queries;
}

describe("AC6 · conditions list", () => {
  it("shows a status chip per place (null as No data), source and flags, and loads more by cursor", async () => {
    const queries = serveList((query) =>
      query.get("cursor") === "c2"
        ? { items: [row(4, { status: "seasonal_lock", source: "season" })], nextCursor: null, total: 4 }
        : {
            items: [
              row(1),
              row(2, { status: "not_now", source: "closure", activeClosureId: "c-1", type: "lake" }),
              row(3, { status: null, source: null, computedAt: null, forecastAt: null }),
            ],
            nextCursor: "c2",
            total: 4,
          },
    );
    const { container } = renderAsAdmin(<ConditionsListView />);

    const table = await screen.findByTestId("conditions-table");
    const go = await within(table).findByTestId("conditions-row-place-1");
    expect(within(go).getByRole("link", { name: "Joy 1" })).toHaveAttribute(
      "href",
      "/conditions/00000000-0000-4000-8000-000000000301",
    );
    expect(within(go).getByText("Go")).toBeInTheDocument();
    expect(within(go).getByText("Forecast")).toBeInTheDocument();

    const closed = within(table).getByTestId("conditions-row-place-2");
    expect(within(closed).getByText("Not now")).toBeInTheDocument();
    expect(within(closed).getByText("Lake")).toBeInTheDocument();
    expect(within(closed).getAllByText("Closure")).toHaveLength(2);

    const empty = within(table).getByTestId("conditions-row-place-3");
    expect(within(empty).getByText("No data")).toBeInTheDocument();
    expect(within(empty).getByText("Not computed yet")).toBeInTheDocument();
    await expectNoAxeViolations(container);

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(await within(table).findByTestId("conditions-row-place-4")).toHaveTextContent("Seasonal lock");
    expect(within(table).getByTestId("conditions-row-place-1")).toBeInTheDocument();
    expect(queries.at(-1)?.get("cursor")).toBe("c2");
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
  });

  it("filters by status in the URL, and tells a filtered-empty list apart", async () => {
    setUrl("/conditions?status=caution");
    const queries = serveList((query) =>
      query.get("status") === "none" ? { items: [], nextCursor: null, total: 0 } : { items: [row(1, { status: "caution" })], nextCursor: null, total: 1 },
    );
    renderAsAdmin(<ConditionsListView />);

    expect(await screen.findByTestId("conditions-row-place-1")).toHaveTextContent("Caution");
    expect(screen.getByTestId("conditions-filter")).toHaveValue("caution");
    expect(queries[0]?.get("status")).toBe("caution");

    fireEvent.change(screen.getByTestId("conditions-filter"), { target: { value: "none" } });
    expect(await screen.findByText("No places for this filter")).toBeInTheDocument();
    expect(currentUrl().params.get("status")).toBe("none");

    fireEvent.click(screen.getByRole("button", { name: "Show all places" }));
    await waitFor(() => expect(currentUrl().params.get("status")).toBeNull());
    await waitFor(() => expect(queries.at(-1)?.get("status")).toBeNull());
  });

  it("starts a recompute, and stays disabled with a toast when one is already running", async () => {
    serveList(() => ({ items: [row(1)], nextCursor: null, total: 1 }));
    let calls = 0;
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.post(RECOMPUTE, async () => {
        calls += 1;
        if (calls === 1) await held;
        return calls === 1
          ? HttpResponse.json({ startedAt: "2026-10-17T05:00:00.000Z" }, { status: 202 })
          : HttpResponse.json(
              { statusCode: 409, code: "RECOMPUTE_RUNNING", message: "x", requestId: "r" },
              { status: 409 },
            );
      }),
    );
    renderAsAdmin(<ConditionsListView />);
    await screen.findByTestId("conditions-row-place-1");

    const button = screen.getByTestId("conditions-recompute");
    fireEvent.click(button);
    await waitFor(() => expect(button).toBeDisabled());
    release();
    expect(await screen.findByText("Recompute started")).toBeInTheDocument();
    await waitFor(() => expect(button).toBeEnabled());

    fireEvent.click(button);
    expect(await screen.findByText("Recompute already running")).toBeInTheDocument();
    expect(button).toBeDisabled();
    expect(calls).toBe(2);
  });
});
