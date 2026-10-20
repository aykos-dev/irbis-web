"use client";

import { ArrowLeft, BookOpen, ListChecks, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { ApiError } from "@/shared/api/errors";
import { useAdminGetLesson } from "@/shared/api/generated/endpoints";
import type { AdminLessonDto, LessonIcon } from "@/shared/api/generated/model";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { ConfirmDialog } from "@/shared/components/ui/confirm-dialog";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { ErrorState } from "@/shared/components/ui/error-state";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { toast } from "@/shared/components/ui/toaster";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";
import { cn } from "@/shared/lib/cn";

import { localTitle } from "../display";
import {
  MAX_QUESTIONS,
  emptyQuestion,
  moveItem,
  toEditorValues,
  toReplaceLesson,
  type EditorValues,
  type QuestionValues,
} from "../editor-values";
import { useLessonEditorActions } from "../hooks/useLessonEditorActions";
import { useUnsavedGuard } from "../hooks/useUnsavedGuard";
import { LESSON_ICONS, LessonIconGlyph } from "../lesson-icons";
import { TITLE_MAX } from "../schemas";
import { L10nGroup } from "./l10n-group";
import { LessonStatusBadge } from "./lesson-status-badge";
import { QuestionCard, type Cleared } from "./question-card";

type Props = { tierId: string; lessonId: string };

function BackLink({ tierId }: { tierId: string }) {
  const t = useTranslations("lessonsAdmin.lessons");
  return (
    <Link
      href={`/lessons/${tierId}`}
      className="inline-flex items-center gap-1.5 self-start rounded-tile text-small font-black text-teal-700 hover:underline"
    >
      <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={3} />
      {t("backToTier")}
    </Link>
  );
}

/** AC7: loads the lesson, then hands it to the form; skeleton / error + retry / offline. */
export function LessonEditor({ tierId, lessonId }: Props) {
  const t = useTranslations("lessonsAdmin");
  const tCommon = useTranslations("common");
  const { isOnline } = useNetworkStatus();
  const lesson = useAdminGetLesson(lessonId);

  if (lesson.data) return <EditorForm key={lesson.data.id} tierId={tierId} lesson={lesson.data} />;

  return (
    <div className="flex flex-col gap-6" data-testid="lessons.editor">
      <BackLink tierId={tierId} />
      {lesson.isError ? (
        <ErrorState
          title={t("editor.errorTitle")}
          description={t("editor.errorDescription")}
          onRetry={() => void lesson.refetch()}
          retrying={lesson.isFetching}
        />
      ) : !isOnline ? (
        <EmptyState icon={BookOpen} title={tCommon("offlineNoData")} />
      ) : (
        <div className="flex flex-col gap-4" aria-busy="true" aria-label={tCommon("loading")}>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}
    </div>
  );
}

type Dialog = { kind: "delete" } | { kind: "removeQuestion"; index: number } | null;

function EditorForm({ tierId, lesson }: { tierId: string; lesson: AdminLessonDto }) {
  const t = useTranslations("lessonsAdmin");
  const locale = useLocale();
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const actions = useLessonEditorActions(tierId, lesson.id);
  const [saved, setSaved] = useState<EditorValues>(() => toEditorValues(lesson));
  const [values, setValues] = useState<EditorValues>(saved);
  const [errors, setErrors] = useState<ReadonlySet<string>>(() => new Set());
  const [dialog, setDialog] = useState<Dialog>(null);
  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(saved), [values, saved]);
  const guard = useUnsavedGuard(dirty);
  const busy = actions.busy;
  const published = lesson.status === "published";

  function clear(cleared: Cleared) {
    if (cleared === "all") {
      setErrors(new Set());
      return;
    }
    setErrors((current) => {
      if (!cleared.some((path) => current.has(path))) return current;
      const next = new Set(current);
      cleared.forEach((path) => next.delete(path));
      return next;
    });
  }

  function update(change: (current: EditorValues) => EditorValues, cleared: Cleared) {
    setValues(change);
    clear(cleared);
  }

  function updateQuestion(index: number, patch: Partial<QuestionValues>, cleared: Cleared) {
    update(
      (current) => ({
        ...current,
        questions: current.questions.map((question, i) => (i === index ? { ...question, ...patch } : question)),
      }),
      cleared,
    );
  }

  /** Puts server fieldErrors on their inputs; returns false when the error had none. */
  function showFieldErrors(error: unknown): boolean {
    if (!(error instanceof ApiError) || !error.fieldErrors) return false;
    setErrors(new Set(Object.keys(error.fieldErrors)));
    return true;
  }

  function reportFailure(error: unknown) {
    if (showFieldErrors(error)) return;
    if (error instanceof ApiError && error.status === null) toast.error(t("toasts.offline"));
    else toast.error(t("toasts.error"));
  }

  function accept(next: AdminLessonDto) {
    const nextValues = toEditorValues(next);
    setSaved(nextValues);
    setValues(nextValues);
    setErrors(new Set());
  }

  function refuseOffline(): boolean {
    if (isOnline) return false;
    toast.error(t("toasts.offline"));
    return true;
  }

  async function saveDraft(): Promise<boolean> {
    try {
      accept(await actions.replace.mutateAsync({ id: lesson.id, data: toReplaceLesson(values) }));
      return true;
    } catch (error: unknown) {
      reportFailure(error);
      return false;
    }
  }

  async function onSave() {
    if (refuseOffline()) return;
    if (await saveDraft()) toast.success(t("editor.toasts.saved"));
  }

  async function onPublish() {
    if (refuseOffline()) return;
    if (dirty && !(await saveDraft())) return;
    try {
      accept(await actions.publish.mutateAsync({ id: lesson.id }));
      toast.success(t("editor.toasts.published"));
    } catch (error: unknown) {
      reportFailure(error);
    }
  }

  async function onUnpublish() {
    if (refuseOffline()) return;
    try {
      const next = await actions.unpublish.mutateAsync({ id: lesson.id });
      if (!dirty) accept(next);
      toast.success(t("editor.toasts.unpublished"));
    } catch (error: unknown) {
      reportFailure(error);
    }
  }

  async function onDelete() {
    if (refuseOffline()) return;
    try {
      await actions.remove.mutateAsync({ id: lesson.id });
      toast.success(t("editor.toasts.deleted"));
      setDialog(null);
      router.push(`/lessons/${tierId}`);
    } catch (error: unknown) {
      setDialog(null);
      reportFailure(error);
    }
  }

  const upload = (file: File) => actions.upload.mutateAsync({ data: { file } });
  const title = localTitle(lesson.title, locale);
  const full = values.questions.length >= MAX_QUESTIONS;

  return (
    <div className="flex flex-col gap-6" data-testid="lessons.editor">
      <BackLink tierId={tierId} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-h1 text-ink">{title}</h1>
          <LessonStatusBadge status={lesson.status} />
        </div>
        <div className="flex flex-wrap gap-3">
          {published ? null : (
            <Button
              variant="danger"
              disabled={busy || !isOnline}
              onClick={() => setDialog({ kind: "delete" })}
              data-testid="lessons.editor.delete"
            >
              {t("actions.delete")}
            </Button>
          )}
          <Button
            variant="white"
            disabled={busy || !isOnline}
            onClick={() => void onSave()}
            data-testid="lessons.editor.save"
          >
            {t("editor.saveDraft")}
          </Button>
          {published ? (
            <Button
              variant="secondary"
              disabled={busy || !isOnline}
              onClick={() => void onUnpublish()}
              data-testid="lessons.editor.unpublish"
            >
              {t("editor.unpublish")}
            </Button>
          ) : (
            <Button disabled={busy || !isOnline} onClick={() => void onPublish()} data-testid="lessons.editor.publish">
              {t("editor.publish")}
            </Button>
          )}
        </div>
      </div>

      {errors.size > 0 ? (
        <p role="status" className="text-copy font-black text-status-notnow-fg" data-testid="lessons.editor.missing-count">
          {t("editor.missingCount", { count: errors.size })}
        </p>
      ) : null}

      <Card>
        <L10nGroup
          legend={t("editor.title")}
          path="title"
          value={values.title}
          onChange={(code, text) =>
            update((current) => ({ ...current, title: { ...current.title, [code]: text } }), ["title", `title.${code}`])
          }
          errors={errors}
          maxLength={TITLE_MAX}
          disabled={busy}
          testIdPrefix="lessons.editor.title"
        />
        <fieldset className="flex flex-col gap-1.5" data-testid="lessons.editor.icon">
          <legend className="pb-1.5 text-small font-black text-ink">{t("field.icon")}</legend>
          <div className="flex flex-wrap gap-2">
            {LESSON_ICONS.map((icon: LessonIcon) => {
              const selected = values.icon === icon;
              return (
                <button
                  key={icon}
                  type="button"
                  aria-label={t(`icons.${icon}`)}
                  aria-pressed={selected}
                  disabled={busy}
                  onClick={() => update((current) => ({ ...current, icon }), ["icon"])}
                  className={cn(
                    "flex size-touch items-center justify-center rounded-tile border-2 transition duration-150",
                    selected ? "border-teal-700 bg-nav-active-bg text-teal-700" : "border-line bg-card text-body hover:bg-soft",
                    errors.has("icon") && "border-red-700",
                  )}
                >
                  <LessonIconGlyph icon={icon} />
                </button>
              );
            })}
          </div>
        </fieldset>
      </Card>

      <section className="flex flex-col gap-4" aria-labelledby="lessons-editor-questions">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="lessons-editor-questions" className="text-h2 text-ink">
            {t("editor.questions")}{" "}
            <span className="text-copy text-muted">
              {t("editor.questionCount", { count: values.questions.length, max: MAX_QUESTIONS })}
            </span>
          </h2>
          <Button
            variant="white"
            disabled={busy || full}
            onClick={() =>
              update((current) => ({ ...current, questions: [...current.questions, emptyQuestion()] }), ["questions"])
            }
            data-testid="lessons.editor.add-question"
          >
            <Plus aria-hidden="true" className="size-4" strokeWidth={3} />
            {t("editor.addQuestion")}
          </Button>
        </div>
        {errors.has("questions") ? <p className="text-small text-status-notnow-fg">{t("validation.server")}</p> : null}
        {values.questions.length === 0 ? (
          <EmptyState icon={ListChecks} title={t("editor.noQuestions")} />
        ) : (
          values.questions.map((question, index) => (
            <QuestionCard
              key={index}
              index={index}
              total={values.questions.length}
              value={question}
              errors={errors}
              disabled={busy}
              isOnline={isOnline}
              onUpdate={(patch, cleared) => updateQuestion(index, patch, cleared)}
              onMove={(step) =>
                update((current) => ({ ...current, questions: moveItem(current.questions, index, step) }), "all")
              }
              onRemove={() => setDialog({ kind: "removeQuestion", index })}
              upload={upload}
            />
          ))
        )}
      </section>

      <ConfirmDialog
        open={dialog?.kind === "delete"}
        onOpenChange={(open) => (open ? undefined : setDialog(null))}
        title={t("editor.deleteTitle", { title })}
        description={t("editor.deleteDescription")}
        confirmLabel={t("actions.delete")}
        tone="danger"
        pending={actions.remove.isPending}
        onConfirm={() => void onDelete()}
      />
      <ConfirmDialog
        open={dialog?.kind === "removeQuestion"}
        onOpenChange={(open) => (open ? undefined : setDialog(null))}
        title={t("editor.removeQuestionTitle", { n: dialog?.kind === "removeQuestion" ? dialog.index + 1 : 0 })}
        description={t("editor.removeQuestionDescription")}
        confirmLabel={t("editor.removeQuestion")}
        tone="danger"
        onConfirm={() => {
          if (dialog?.kind === "removeQuestion") {
            const removed = dialog.index;
            update((current) => ({ ...current, questions: current.questions.filter((_, i) => i !== removed) }), "all");
          }
          setDialog(null);
        }}
      />
      <ConfirmDialog
        open={guard.pendingHref !== null}
        onOpenChange={(open) => (open ? undefined : guard.stay())}
        title={t("editor.unsaved")}
        description={t("editor.unsavedDescription")}
        confirmLabel={t("editor.leave")}
        tone="danger"
        onConfirm={guard.leave}
      />
    </div>
  );
}
