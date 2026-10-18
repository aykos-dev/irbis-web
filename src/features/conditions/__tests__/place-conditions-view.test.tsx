import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { PlaceConditionsView } from "@/features/conditions/components/place-conditions-view";
import { toTashkentInput } from "@/features/conditions/datetime";
import { expectNoAxeViolations } from "@test/axe";
import { renderAsAdmin } from "@test/session";
import { server } from "@test/server";

const API = "http://api.test/v1/admin";
const PLACE_ID = "00000000-0000-4000-8000-000000000301";
const CLOSURE_ID = "00000000-0000-4000-8000-000000000401";

function closure(overrides: Record<string, unknown> = {}) {
  return {
    id: CLOSURE_ID,
    placeId: PLACE_ID,
    startsAt: "2026-10-16T05:00:00.000Z",
    endsAt: null,
    reason: { uz: "Yoʻl taʼmirlanmoqda", ru: null, en: null },
    source: "official",
    createdAt: "2026-10-16T05:00:00.000Z",
    endedAt: null,
    active: true,
    ...overrides,
  };
}

function controls(overrides: Record<string, unknown> = {}) {
  return {
    condition: {
      placeId: PLACE_ID,
      status: "caution",
      source: "forecast",
      reasons: [{ code: "WIND", day: "sat", value: 45 }, { code: "PRECIP_LIKELY" }],
      text: null,
      opensMonth: null,
      hazards: [],
      weekend: [],
      forecastAt: "2026-10-17T04:00:00.000Z",
      computedAt: "2026-10-17T05:00:00.000Z",
    },
    closures: [closure()],
    overrides: [],
    ...overrides,
  };
}

function serveControls(initial = controls()) {
  const state = { body: initial, gets: 0 };
  server.use(
    http.get(`${API}/places/${PLACE_ID}/condition-controls`, () => {
      state.gets += 1;
      return HttpResponse.json(state.body);
    }),
  );
  return state;
}

function apiError(status: number, code: string, extra: Record<string, unknown> = {}) {
  return HttpResponse.json({ statusCode: status, code, message: "x", requestId: "r", ...extra }, { status });
}

describe("AC6 · place conditions", () => {
  it("validates the closure form client-side, sends ISO UTC, and maps server field errors", async () => {
    serveControls();
    const bodies: unknown[] = [];
    server.use(
      http.post(`${API}/places/${PLACE_ID}/closures`, async ({ request }) => {
        bodies.push(await request.json());
        return bodies.length === 1
          ? apiError(400, "VALIDATION_FAILED", { fieldErrors: { "reason.ru": ["too long"] } })
          : HttpResponse.json(closure(), { status: 201 });
      }),
    );
    renderAsAdmin(<PlaceConditionsView placeId={PLACE_ID} />);
    const form = await screen.findByTestId("closure-form");
    const submit = within(form).getByRole("button", { name: "Add closure" });

    fireEvent.change(within(form).getByLabelText("Starts"), { target: { value: "2026-10-20T09:00" } });
    fireEvent.change(within(form).getByLabelText("Ends"), { target: { value: "2026-10-19T09:00" } });
    fireEvent.change(within(form).getByLabelText("Reason (English)"), { target: { value: "x".repeat(281) } });
    fireEvent.click(submit);
    expect(await within(form).findByText("Write a reason in Uzbek.")).toBeInTheDocument();
    expect(within(form).getByText("The end must be after the start.")).toBeInTheDocument();
    expect(within(form).getByText("Keep it to 280 characters or fewer.")).toBeInTheDocument();
    expect(bodies).toHaveLength(0);

    fireEvent.change(within(form).getByLabelText("Ends"), { target: { value: "" } });
    fireEvent.change(within(form).getByLabelText("Reason (English)"), { target: { value: "" } });
    fireEvent.change(within(form).getByLabelText("Reason (Uzbek)"), { target: { value: "Sel xavfi" } });
    fireEvent.change(within(form).getByLabelText("Reason (Russian)"), { target: { value: "Риск селя" } });
    fireEvent.click(submit);
    expect(await within(form).findByText("Check this field.")).toBeInTheDocument();
    expect(bodies[0]).toEqual({
      startsAt: "2026-10-20T04:00:00.000Z",
      reason: { uz: "Sel xavfi", ru: "Риск селя" },
      source: "admin",
    });

    fireEvent.click(submit);
    expect(await screen.findByText("Closure added")).toBeInTheDocument();
    expect(bodies).toHaveLength(2);
  });

  it("shows reasons as labels and closures, ends a closure after confirming; Already ended refetches", async () => {
    const state = serveControls();
    let ends = 0;
    server.use(
      http.post(`${API}/closures/${CLOSURE_ID}/end`, () => {
        ends += 1;
        if (ends === 2) return apiError(409, "CLOSURE_ALREADY_ENDED");
        state.body = controls({ closures: [closure({ active: false, endedAt: "2026-10-17T06:00:00.000Z" })] });
        return HttpResponse.json(state.body.closures[0]);
      }),
    );
    const { container, unmount } = renderAsAdmin(<PlaceConditionsView placeId={PLACE_ID} />);

    const reasons = await screen.findByTestId("condition-reasons");
    expect(reasons).toHaveTextContent("Strong wind");
    expect(reasons).toHaveTextContent("Rain likely");
    const table = screen.getByTestId("closures-table");
    const row = () => within(table).getAllByRole("row")[1];
    expect(row()).toHaveTextContent("Open-ended");
    expect(row()).toHaveTextContent("Yoʻl taʼmirlanmoqda");
    expect(row()).toHaveTextContent("Official");
    expect(row()).toHaveTextContent("Active");
    await expectNoAxeViolations(container);

    fireEvent.click(within(table).getByRole("button", { name: "End" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("End this now? The status updates at once.");
    expect(ends).toBe(0);
    fireEvent.click(within(dialog).getByTestId("admin.dialog-confirm"));

    expect(await screen.findByText("Closure ended")).toBeInTheDocument();
    await waitFor(() => expect(row()).toHaveTextContent("Ended"));
    expect(within(table).queryByRole("button", { name: "End" })).not.toBeInTheDocument();

    // A stale screen: the server still lists it as active, but ending it again says it already ended.
    unmount();
    state.body = controls();
    renderAsAdmin(<PlaceConditionsView placeId={PLACE_ID} />);
    const stale = await screen.findByTestId("closures-table");
    const gets = state.gets;
    fireEvent.click(within(stale).getByRole("button", { name: "End" }));
    fireEvent.click(within(await screen.findByRole("dialog")).getByTestId("admin.dialog-confirm"));
    expect(await screen.findByText("Already ended")).toBeInTheDocument();
    await waitFor(() => expect(state.gets).toBeGreaterThan(gets));
    expect(ends).toBe(2);
  });

  it("validates the override expiry (max 14 days ahead) before sending", async () => {
    serveControls();
    let sent = false;
    server.use(
      http.post(`${API}/places/${PLACE_ID}/overrides`, () => {
        sent = true;
        return HttpResponse.json({}, { status: 201 });
      }),
    );
    renderAsAdmin(<PlaceConditionsView placeId={PLACE_ID} />);
    const form = await screen.findByTestId("override-form");

    fireEvent.change(within(form).getByLabelText("Reason (Uzbek)"), { target: { value: "Koʻprik yopiq" } });
    fireEvent.change(within(form).getByLabelText("Expires"), {
      target: { value: toTashkentInput(new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)) },
    });
    fireEvent.click(within(form).getByRole("button", { name: "Set override" }));

    expect(await within(form).findByText("The expiry can be at most 14 days ahead.")).toBeInTheDocument();
    expect(sent).toBe(false);
  });
});
