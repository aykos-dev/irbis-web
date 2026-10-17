"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import type { AdminUserDetailDto, BlockReasonCode } from "@/shared/api/generated/model";
import { BlockReasonCode as BlockReasons, Role } from "@/shared/api/generated/model";
import { Button } from "@/shared/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Field, Input, Select, Textarea } from "@/shared/components/ui/field";
import { can } from "@/shared/hooks/usePermission";

import { useUserActions } from "../hooks/useUserActions";
import {
  blockSchema,
  passwordSchema,
  phoneSchema,
  roleSchema,
  unblockSchema,
  type BlockValues,
  type PasswordValues,
  type PhoneValues,
  type RoleValues,
  type UnblockValues,
} from "../schemas";
import { ActionDialog } from "./action-dialog";

type ActionKind = "block" | "unblock" | "password" | "phone" | "role";

type UserActionsProps = {
  className?: string;
  user: AdminUserDetailDto;
  selfId: string | null;
  selfRole: Role | null;
};

/** Canvas W5 "Actions": each button opens its own reason-required dialog (AC15). */
export function UserActions({ user, selfId, selfRole, className }: UserActionsProps) {
  const t = useTranslations("users");
  const [open, setOpen] = useState<ActionKind | null>(null);
  const actions = useUserActions(user.id);
  const context = { role: selfRole, selfId, targetId: user.id };
  const canBlock = can("users.block", context);
  const canChangeRole = can("users.change-role", context);
  const blocked = user.status === "blocked";
  const close = (next: boolean) => {
    if (!next) setOpen(null);
  };
  const reasons: readonly BlockReasonCode[] = Object.values(BlockReasons);
  const nextRole: Role = user.role === Role.admin ? Role.user : Role.admin;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{t("actions.title")}</CardTitle>
        <CardDescription>{t("actions.description")}</CardDescription>
      </CardHeader>
      <div className="flex flex-wrap gap-3">
        {canBlock ? (
          blocked ? (
            <Button variant="white" onClick={() => setOpen("unblock")} data-testid="admin.user-action-unblock">
              {t("actions.unblock")}
            </Button>
          ) : (
            <Button variant="white" onClick={() => setOpen("block")} data-testid="admin.user-action-block">
              {t("actions.block")}
            </Button>
          )
        ) : null}
        <Button variant="white" onClick={() => setOpen("password")} data-testid="admin.user-action-password">
          {t("actions.setPassword")}
        </Button>
        <Button variant="white" onClick={() => setOpen("phone")} data-testid="admin.user-action-phone">
          {t("actions.editPhone")}
        </Button>
        {canChangeRole ? (
          <Button variant="white" onClick={() => setOpen("role")} data-testid="admin.user-action-role">
            {t("actions.changeRole")}
          </Button>
        ) : null}
      </div>

      {open === "block" ? (
      <ActionDialog<BlockValues>
        open
        onOpenChange={close}
        title={t("dialogs.block.title", { username: user.username })}
        description={t("dialogs.block.description")}
        confirmLabel={t("dialogs.block.confirm")}
        tone="danger"
        successMessage={t("dialogs.block.success", { username: user.username })}
        schema={blockSchema}
        defaultValues={{ reasonCode: BlockReasons.spam, note: "" }}
        onSubmit={(values) => actions.block.mutateAsync({ id: user.id, data: values })}
        fields={(api) => (
          <>
            <Field label={t("dialogs.reason")} error={api.error("reasonCode")}>
              {(control) => (
                <Select {...api.register("reasonCode")} {...control} data-testid="admin.dialog-reason">
                  {reasons.map((code) => (
                    <option key={code} value={code}>
                      {t(`reasons.${code}`)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t("dialogs.note")} hint={t("dialogs.noteHint")} error={api.error("note")}>
              {(control) => <Textarea {...api.register("note")} {...control} rows={3} maxLength={500} data-testid="admin.dialog-note" />}
            </Field>
          </>
        )}
      />
      ) : null}

      {open === "unblock" ? (
      <ActionDialog<UnblockValues>
        open
        onOpenChange={close}
        title={t("dialogs.unblock.title", { username: user.username })}
        description={t("dialogs.unblock.description")}
        confirmLabel={t("dialogs.unblock.confirm")}
        successMessage={t("dialogs.unblock.success", { username: user.username })}
        schema={unblockSchema}
        defaultValues={{ note: "" }}
        onSubmit={(values) => actions.unblock.mutateAsync({ id: user.id, data: values })}
        fields={(api) => (
          <Field label={t("dialogs.reason")} hint={t("dialogs.reasonHint")} error={api.error("note")}>
            {(control) => <Textarea {...api.register("note")} {...control} rows={3} maxLength={500} data-testid="admin.dialog-reason" />}
          </Field>
        )}
      />
      ) : null}

      {open === "password" ? (
      <ActionDialog<PasswordValues>
        open
        onOpenChange={close}
        title={t("dialogs.password.title", { username: user.username })}
        description={t("dialogs.password.description")}
        confirmLabel={t("dialogs.password.confirm")}
        tone="danger"
        successMessage={t("dialogs.password.success", { username: user.username })}
        schema={passwordSchema}
        defaultValues={{ newPassword: "", note: "" }}
        fieldForCode={{ PASSWORD_WEAK: "newPassword" }}
        onSubmit={(values) => actions.setPassword.mutateAsync({ id: user.id, data: values })}
        fields={(api) => (
          <>
            <Field label={t("dialogs.password.field")} hint={t("dialogs.password.hint")} error={api.error("newPassword")}>
              {(control) => (
                <Input
                  {...api.register("newPassword")}
                  {...control}
                  type="password"
                  autoComplete="new-password"
                  data-testid="admin.dialog-password"
                />
              )}
            </Field>
            <Field label={t("dialogs.reason")} hint={t("dialogs.reasonHint")} error={api.error("note")}>
              {(control) => <Textarea {...api.register("note")} {...control} rows={3} maxLength={500} data-testid="admin.dialog-reason" />}
            </Field>
          </>
        )}
      />
      ) : null}

      {open === "phone" ? (
      <ActionDialog<PhoneValues>
        open
        onOpenChange={close}
        title={t("dialogs.phone.title", { username: user.username })}
        description={t("dialogs.phone.description")}
        confirmLabel={t("dialogs.phone.confirm")}
        successMessage={t("dialogs.phone.success", { username: user.username })}
        schema={phoneSchema}
        defaultValues={{ phone: "", note: "" }}
        fieldForCode={{ PHONE_INVALID: "phone" }}
        onSubmit={(values) =>
          actions.setRecoveryPhone.mutateAsync({
            id: user.id,
            data: { phone: values.phone.replace(/[\s-]/g, ""), note: values.note },
          })
        }
        fields={(api) => (
          <>
            <Field label={t("dialogs.phone.field")} hint={t("dialogs.phone.hint")} error={api.error("phone")}>
              {(control) => (
                <Input {...api.register("phone")} {...control} type="tel" autoComplete="off" inputMode="tel" data-testid="admin.dialog-phone" />
              )}
            </Field>
            <Field label={t("dialogs.reason")} hint={t("dialogs.reasonHint")} error={api.error("note")}>
              {(control) => <Textarea {...api.register("note")} {...control} rows={3} maxLength={500} data-testid="admin.dialog-reason" />}
            </Field>
          </>
        )}
      />
      ) : null}

      {open === "role" ? (
      <ActionDialog<RoleValues>
        open
        onOpenChange={close}
        title={t("dialogs.role.title", { username: user.username })}
        description={t("dialogs.role.description")}
        confirmLabel={t("dialogs.role.confirm")}
        successMessage={t("dialogs.role.success", { username: user.username })}
        schema={roleSchema}
        defaultValues={{ role: nextRole, note: "" }}
        onSubmit={(values) => actions.setRole.mutateAsync({ id: user.id, data: values })}
        fields={(api) => (
          <>
            <Field label={t("dialogs.role.field")} error={api.error("role")}>
              {(control) => (
                <Select {...api.register("role")} {...control} data-testid="admin.dialog-role">
                  {Object.values(Role).map((role) => (
                    <option key={role} value={role}>
                      {t(`roles.${role}`)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t("dialogs.reason")} hint={t("dialogs.reasonHint")} error={api.error("note")}>
              {(control) => <Textarea {...api.register("note")} {...control} rows={3} maxLength={500} data-testid="admin.dialog-reason" />}
            </Field>
          </>
        )}
      />
      ) : null}
    </Card>
  );
}
