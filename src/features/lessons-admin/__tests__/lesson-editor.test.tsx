import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { LessonEditor } from "@/features/lessons-admin/components/lesson-editor";
import { expectNoAxeViolations } from "@test/axe";
import { renderAsAdmin } from "@test/session";
import { server } from "@test/server";

const API = "http://api.test/v1/admin";
const TIER_ID = "00000000-0000-4000-8000-000000000501";
const LESSON_ID = "00000000-0000-4000-8000-000000000601";

function l10n(text: string) {
  return { uz: `${text} uz`, ru: `${text} ru`, en: `${text} en` };
}

function question(index: number) {
  return {
    id: `00000000-0000-4000-8000-0000000007${String(index).padStart(2, "0")}`,
    order: index,
    prompt: l10n(`Prompt ${index}`),
    hint: null,
    options: [l10n("Yes"), l10n("No"), l10n("Maybe")],
    correctIndex: 0,
    explanation: l10n("Because"),
    wrongExplanation: null,
    image: null,
  };
}

function lesson(questionCount: number) {
  return {
    id: LESSON_ID,
    tierId: TIER_ID,
    title: l10n("Lesson"),
    icon: "compass",
    order: 1,
    status: "draft",
    questionCount,
    publishedAt: null,
    updatedAt: "2026-10-17T05:30:00.000Z",
    questions: Array.from({ length: questionCount }, (_, i) => question(i + 1)),
  };
}

describe("AC7 · lesson editor", () => {
  it("maps publish fieldErrors onto the exact inputs and counts them", async () => {
    server.use(
      http.get(`${API}/lessons/${LESSON_ID}`, () => HttpResponse.json(lesson(1))),
      http.post(`${API}/lessons/${LESSON_ID}/publish`, () =>
        HttpResponse.json(
          {
            statusCode: 400,
            code: "VALIDATION_FAILED",
            message: "x",
            requestId: "r",
            fieldErrors: { "title.ru": ["required"], "questions.0.options.1.ru": ["required"] },
          },
          { status: 400 },
        ),
      ),
    );
    const { container } = renderAsAdmin(<LessonEditor tierId={TIER_ID} lessonId={LESSON_ID} />);

    expect(await screen.findByRole("heading", { level: 1, name: "Lesson en" })).toBeInTheDocument();
    await expectNoAxeViolations(container);

    fireEvent.click(screen.getByTestId("lessons.editor.publish"));
    expect(await screen.findByTestId("lessons.editor.missing-count")).toHaveTextContent(
      "2 fields missing to publish",
    );
    expect(screen.getByTestId("lessons.editor.title.ru")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByTestId("lessons.editor.title.uz")).not.toHaveAttribute("aria-invalid");
    const option = document.getElementsByName("questions.0.options.1.ru").item(0);
    expect(option).toHaveAttribute("aria-invalid", "true");
    expect(document.getElementsByName("questions.0.options.1.uz").item(0)).not.toHaveAttribute("aria-invalid");

    fireEvent.change(screen.getByTestId("lessons.editor.title.ru"), { target: { value: "Урок" } });
    expect(screen.getByTestId("lessons.editor.missing-count")).toHaveTextContent("1 field missing to publish");
  });

  it("adds questions up to 15 and removes one after confirming", async () => {
    server.use(http.get(`${API}/lessons/${LESSON_ID}`, () => HttpResponse.json(lesson(14))));
    renderAsAdmin(<LessonEditor tierId={TIER_ID} lessonId={LESSON_ID} />);

    const add = await screen.findByTestId("lessons.editor.add-question");
    expect(add).toBeEnabled();
    fireEvent.click(add);
    expect(screen.getByTestId("lessons.editor.q.15")).toBeInTheDocument();
    expect(add).toBeDisabled();

    fireEvent.click(screen.getByTestId("lessons.editor.q.15.remove"));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByTestId("admin.dialog-confirm"));
    await waitFor(() => expect(screen.queryByTestId("lessons.editor.q.15")).not.toBeInTheDocument());
    expect(add).toBeEnabled();
  });

  it("saves the chosen correct option and a removed option in the PUT body", async () => {
    const puts: Array<{ questions: Array<{ options: unknown[]; correctIndex: number }> }> = [];
    server.use(
      http.get(`${API}/lessons/${LESSON_ID}`, () => HttpResponse.json(lesson(1))),
      http.put(`${API}/lessons/${LESSON_ID}`, async ({ request }) => {
        const body = (await request.json()) as (typeof puts)[number];
        puts.push(body);
        return HttpResponse.json(lesson(1));
      }),
    );
    renderAsAdmin(<LessonEditor tierId={TIER_ID} lessonId={LESSON_ID} />);

    const third = await screen.findByTestId("lessons.editor.q.1.correct.3");
    fireEvent.click(third);
    expect(third).toBeChecked();
    expect(screen.getByTestId("lessons.editor.q.1.correct.1")).not.toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: "Remove option: Option 1" }));
    expect(screen.getByTestId("lessons.editor.q.1.correct.2")).toBeChecked();
    expect(screen.getByRole("button", { name: "Remove option: Option 1" })).toBeDisabled();

    fireEvent.click(screen.getByTestId("lessons.editor.save"));
    expect(await screen.findByText("Draft saved")).toBeInTheDocument();
    expect(puts).toHaveLength(1);
    expect(puts[0]?.questions[0]?.correctIndex).toBe(1);
    expect(puts[0]?.questions[0]?.options).toEqual([l10n("No"), l10n("Maybe")]);
  });
});
