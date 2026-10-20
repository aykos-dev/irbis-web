import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { TierLessonsView } from "@/features/lessons-admin/components/tier-lessons-view";
import { TiersView } from "@/features/lessons-admin/components/tiers-view";
import { expectNoAxeViolations } from "@test/axe";
import { currentUrl } from "@test/navigation-mock";
import { renderAsAdmin } from "@test/session";
import { server } from "@test/server";

const API = "http://api.test/v1/admin";
const TIER_ID = "00000000-0000-4000-8000-000000000501";

function tier(index: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `00000000-0000-4000-8000-00000000050${index}`,
    key: `tier-${index}`,
    title: { uz: `Bosqich ${index}`, ru: `Уровень ${index}`, en: `Tier ${index}` },
    colour: "#1A7F6E",
    order: index,
    lessonCount: 0,
    publishedCount: 0,
    ...overrides,
  };
}

function lesson(index: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `00000000-0000-4000-8000-00000000060${index}`,
    title: { uz: `Dars ${index}`, ru: `Урок ${index}`, en: `Lesson ${index}` },
    icon: "compass",
    order: index,
    status: "draft",
    questionCount: 0,
    publishedAt: null,
    updatedAt: "2026-10-17T05:30:00.000Z",
    ...overrides,
  };
}

describe("AC6 · lesson tiers", () => {
  it("lists tiers in order, blocks deleting a tier with lessons, and reorders with the full id list", async () => {
    const tiers = [tier(1, { lessonCount: 3, publishedCount: 2 }), tier(2)];
    const reorders: unknown[] = [];
    server.use(
      http.get(`${API}/lesson-tiers`, () => HttpResponse.json({ items: tiers })),
      http.post(`${API}/lesson-tiers/reorder`, async ({ request }) => {
        reorders.push(await request.json());
        return HttpResponse.json({ items: [tiers[1], tiers[0]] });
      }),
    );
    const { container } = renderAsAdmin(<TiersView />);

    const table = await screen.findByTestId("lessons.tiers.table");
    const first = await within(table).findByTestId("lessons.tier.row.tier-1");
    expect(within(first).getByRole("link", { name: "Tier 1" })).toHaveAttribute("href", `/lessons/${tiers[0]?.id}`);
    expect(within(first).getByText("#1A7F6E")).toBeInTheDocument();
    expect(within(first).getByTestId("lessons.tier.delete")).toBeDisabled();
    expect(within(first).getByText("Remove its lessons first")).toBeInTheDocument();
    expect(within(within(table).getByTestId("lessons.tier.row.tier-2")).getByTestId("lessons.tier.delete")).toBeEnabled();
    await expectNoAxeViolations(container);

    fireEvent.click(within(first).getByTestId("lessons.tier.down"));
    expect(await screen.findByText("Order saved")).toBeInTheDocument();
    expect(reorders).toEqual([{ ids: [tiers[1]?.id, tiers[0]?.id] }]);
  });

  it("shows TIER_KEY_TAKEN inline on the key field of the new tier dialog", async () => {
    server.use(
      http.get(`${API}/lesson-tiers`, () => HttpResponse.json({ items: [tier(1)] })),
      http.post(`${API}/lesson-tiers`, () =>
        HttpResponse.json(
          { statusCode: 409, code: "TIER_KEY_TAKEN", message: "x", requestId: "r" },
          { status: 409 },
        ),
      ),
    );
    renderAsAdmin(<TiersView />);
    await screen.findByTestId("lessons.tier.row.tier-1");

    fireEvent.click(screen.getByTestId("lessons.tiers.new"));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Key"), { target: { value: "tier-1" } });
    fireEvent.change(within(dialog).getByLabelText("Title (Uzbek)"), { target: { value: "Bosqich" } });
    fireEvent.change(within(dialog).getByLabelText("Title (Russian)"), { target: { value: "Уровень" } });
    fireEvent.change(within(dialog).getByLabelText("Title (English)"), { target: { value: "Tier" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(await within(dialog).findByText("This key is already used")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Key")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("AC6 · tier lessons", () => {
  it("validates the new lesson dialog, then creates with the chosen icon and opens the lesson", async () => {
    const created: unknown[] = [];
    server.use(
      http.get(`${API}/lesson-tiers`, () => HttpResponse.json({ items: [tier(1)] })),
      http.get(`${API}/lesson-tiers/${TIER_ID}/lessons`, () =>
        HttpResponse.json({ items: [lesson(1, { status: "published", questionCount: 4 })] }),
      ),
      http.post(`${API}/lessons`, async ({ request }) => {
        created.push(await request.json());
        return HttpResponse.json({ id: "lesson-new" }, { status: 201 });
      }),
    );
    const { container } = renderAsAdmin(<TierLessonsView tierId={TIER_ID} />);

    expect(await screen.findByRole("heading", { level: 1, name: "Tier 1" })).toBeInTheDocument();
    const row = await screen.findByTestId(`lessons.lesson.row.${lesson(1).id}`);
    expect(within(row).getByText("Published")).toBeInTheDocument();
    expect(within(row).getByText("17.10.2026 10:30")).toBeInTheDocument();
    await expectNoAxeViolations(container);

    fireEvent.click(screen.getByTestId("lessons.list.new"));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));
    expect(await within(dialog).findAllByText("Write a title.")).toHaveLength(3);
    expect(created).toHaveLength(0);

    fireEvent.change(within(dialog).getByLabelText("Title (Uzbek)"), { target: { value: "Dars" } });
    fireEvent.change(within(dialog).getByLabelText("Title (Russian)"), { target: { value: "Урок" } });
    fireEvent.change(within(dialog).getByLabelText("Title (English)"), { target: { value: "Lesson" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Avalanche" }));
    expect(within(dialog).getByRole("button", { name: "Avalanche" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));

    await waitFor(() => expect(currentUrl().pathname).toBe(`/lessons/${TIER_ID}/lesson-new`));
    expect(created).toEqual([
      { tierId: TIER_ID, title: { uz: "Dars", ru: "Урок", en: "Lesson" }, icon: "avalanche" },
    ]);
  });
});
