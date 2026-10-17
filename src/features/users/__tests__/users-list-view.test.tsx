import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { UsersListView } from "@/features/users/components/users-list-view";
import { expectNoAxeViolations } from "@test/axe";
import { currentUrl, setUrl } from "@test/navigation-mock";
import { renderAsAdmin } from "@test/session";
import { server } from "@test/server";

const LIST = "http://api.test/v1/admin/users";

function user(index: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `00000000-0000-4000-8000-0000000001${String(index).padStart(2, "0")}`,
    username: `guest_${index}`,
    role: "user",
    status: "active",
    joinedAt: "2026-10-17T05:00:00.000Z",
    lastActiveAt: "2026-10-17T05:30:00.000Z",
    recoveryPhoneMasked: "+998 •• ••• •• 21",
    ...overrides,
  };
}

/** Records every list request's query so tests can assert what the server was asked. */
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

describe("AC14 · users table", () => {
  it("lists users with masked recovery phones, status chips and the total", async () => {
    serveList(() => ({
      items: [user(1), user(2, { status: "blocked", recoveryPhoneMasked: null, role: "admin" })],
      nextCursor: null,
      total: 1284,
    }));
    const { container } = renderAsAdmin(<UsersListView />);

    await screen.findByTestId("admin.users-total");
    const table = screen.getByTestId("admin.users-table");
    expect(within(table).getByRole("link", { name: "guest_1" })).toHaveAttribute(
      "href",
      "/users/00000000-0000-4000-8000-000000000101",
    );
    expect(within(table).getByText("+998 •• ••• •• 21")).toBeInTheDocument();
    expect(within(table).getByText("Blocked")).toBeInTheDocument();
    expect(screen.getByTestId("admin.users-total")).toHaveTextContent("Showing 1–2 of 1,284");
    expect(document.body.textContent).not.toMatch(/\+998\d{9}/);
    await expectNoAxeViolations(container);
  });

  it("debounces the search and keeps it in the URL", async () => {
    const queries = serveList(() => ({ items: [user(1)], nextCursor: null, total: 1 }));
    renderAsAdmin(<UsersListView />);
    await screen.findByTestId("admin.users-total");
    const initialRequests = queries.length;

    fireEvent.change(screen.getByTestId("admin.users-search"), { target: { value: "pe" } });
    fireEvent.change(screen.getByTestId("admin.users-search"), { target: { value: "peak" } });
    expect(currentUrl().params.get("q")).toBeNull();

    await waitFor(() => expect(currentUrl().params.get("q")).toBe("peak"), { timeout: 2000 });
    await waitFor(() => expect(queries.at(-1)?.get("q")).toBe("peak"));
    expect(queries.length).toBe(initialRequests + 1);
  });

  it("filters by status, role and joined and sorts by joined or last active, all in the URL", async () => {
    const queries = serveList(() => ({ items: [user(1)], nextCursor: null, total: 1 }));
    renderAsAdmin(<UsersListView />);
    await screen.findByTestId("admin.users-total");

    fireEvent.change(screen.getByTestId("admin.users-filter-status"), { target: { value: "blocked" } });
    fireEvent.change(screen.getByTestId("admin.users-filter-role"), { target: { value: "admin" } });
    fireEvent.change(screen.getByTestId("admin.users-filter-joined"), { target: { value: "7d" } });
    fireEvent.click(screen.getByTestId("admin.users-sort-active"));

    await waitFor(() => {
      const last = queries.at(-1);
      expect(last?.get("status")).toBe("blocked");
      expect(last?.get("role")).toBe("admin");
      expect(last?.get("joined")).toBe("7d");
      expect(last?.get("sort")).toBe("active_desc");
    });
    expect(currentUrl().params.get("status")).toBe("blocked");
    expect(currentUrl().params.get("sort")).toBe("active_desc");

    fireEvent.click(screen.getByTestId("admin.users-sort-active"));
    await waitFor(() => expect(queries.at(-1)?.get("sort")).toBe("active_asc"));
  });

  it("restores filters from the URL", async () => {
    setUrl("/users?status=locked&joined=30d&sort=joined_asc");
    const queries = serveList(() => ({ items: [user(1)], nextCursor: null, total: 1 }));
    renderAsAdmin(<UsersListView />);

    await screen.findByTestId("admin.users-total");
    expect(screen.getByTestId("admin.users-filter-status")).toHaveValue("locked");
    expect(queries[0]?.get("status")).toBe("locked");
    expect(queries[0]?.get("joined")).toBe("30d");
    expect(queries[0]?.get("sort")).toBe("joined_asc");
  });

  it("pages forward and back with cursors", async () => {
    const queries = serveList((query) =>
      query.get("cursor") === "c2"
        ? { items: [user(21)], nextCursor: null, total: 21 }
        : { items: Array.from({ length: 20 }, (_, index) => user(index + 1)), nextCursor: "c2", total: 21 },
    );
    renderAsAdmin(<UsersListView />);
    await screen.findByTestId("admin.users-total");
    expect(screen.getByTestId("admin.users-prev")).toBeDisabled();
    expect(screen.getByTestId("admin.users-total")).toHaveTextContent("Showing 1–20 of 21");

    fireEvent.click(screen.getByTestId("admin.users-next"));
    await waitFor(() => expect(screen.getByTestId("admin.users-total")).toHaveTextContent("Showing 21–21 of 21"));
    expect(queries.at(-1)?.get("cursor")).toBe("c2");
    expect(currentUrl().params.get("cursor")).toBe("c2");
    expect(screen.getByTestId("admin.users-next")).toBeDisabled();

    fireEvent.click(screen.getByTestId("admin.users-prev"));
    await waitFor(() => expect(screen.getByTestId("admin.users-total")).toHaveTextContent("Showing 1–20 of 21"));
    expect(currentUrl().params.get("cursor")).toBeNull();
  });

  it("tells filtered-empty apart from no data and clears the filters", async () => {
    setUrl("/users?status=blocked");
    serveList((query) =>
      query.get("status") ? { items: [], nextCursor: null, total: 0 } : { items: [user(1)], nextCursor: null, total: 1 },
    );
    renderAsAdmin(<UsersListView />);

    expect(await screen.findByText("No users match")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("admin.users-clear-filters"));
    expect(await screen.findByTestId("admin.users-total")).toBeInTheDocument();
    expect(currentUrl().params.get("status")).toBeNull();
  });

  it("shows no-data when there are no accounts at all", async () => {
    serveList(() => ({ items: [], nextCursor: null, total: 0 }));
    renderAsAdmin(<UsersListView />);

    expect(await screen.findByText("No users yet")).toBeInTheDocument();
    expect(screen.queryByTestId("admin.users-clear-filters")).not.toBeInTheDocument();
  });

  it("shows an error with retry", async () => {
    server.use(
      http.get(LIST, () => HttpResponse.json({ statusCode: 500, code: "INTERNAL", message: "x", requestId: "r" }, { status: 500 })),
    );
    renderAsAdmin(<UsersListView />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Users could not be loaded");

    serveList(() => ({ items: [user(1)], nextCursor: null, total: 1 }));
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByTestId("admin.users-total")).toBeInTheDocument();
  });

  it("offers no export", async () => {
    serveList(() => ({ items: [user(1)], nextCursor: null, total: 1 }));
    renderAsAdmin(<UsersListView />);
    await screen.findByTestId("admin.users-total");

    expect(screen.queryByRole("button", { name: /export|csv/i })).not.toBeInTheDocument();
  });
});
