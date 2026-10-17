"use client";

import { SearchX, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { AdminJoinedFilter, AdminUserSort, AdminUserStatus, Role } from "@/shared/api/generated/model";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { DataTable } from "@/shared/components/ui/data-table";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { ErrorState } from "@/shared/components/ui/error-state";
import { Field, Input, Select } from "@/shared/components/ui/field";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";
import { useUrlState } from "@/shared/hooks/useUrlState";
import { formatNumber } from "@/shared/lib/format";

import { createUserColumns } from "../columns";
import { useUsersList } from "../hooks/useUsersList";
import { hasActiveFilters, PAGE_SIZE, parseUsersQuery, serializeBack } from "../users-query";

const SEARCH_DEBOUNCE_MS = 300;
const RESET_PAGING = { cursor: null, back: null } as const;

/** Canvas W4: search + filters + sortable table + cursor pagination; everything in the URL (AC14). */
export function UsersListView() {
  const t = useTranslations("users");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { isOnline } = useNetworkStatus();
  const { params, update } = useUrlState();
  const query = useMemo(() => parseUsersQuery(params), [params]);
  const list = useUsersList(query);

  const [search, setSearch] = useState(query.q);
  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS);
  // The URL is the source of truth: adopt q changes made elsewhere (Back, Clear filters), but
  // never while the admin is mid-typing (search not yet settled into debouncedSearch).
  const [syncedQ, setSyncedQ] = useState(query.q);
  if (query.q !== syncedQ) {
    setSyncedQ(query.q);
    if (search === debouncedSearch) setSearch(query.q);
  }
  useEffect(() => {
    if (search === debouncedSearch && debouncedSearch.trim() !== query.q) {
      update({ q: debouncedSearch.trim(), ...RESET_PAGING });
    }
  }, [search, debouncedSearch, query.q, update]);

  const columns = useMemo(
    () =>
      createUserColumns({
        labels: {
          username: t("list.columns.username"),
          joined: t("list.columns.joined"),
          lastActive: t("list.columns.lastActive"),
          status: t("list.columns.status"),
          role: t("list.columns.role"),
          recoveryPhone: t("list.columns.recoveryPhone"),
        },
        roleLabels: { user: t("roles.user"), admin: t("roles.admin") },
        locale,
        sort: query.sort,
        onSort: (sort) => update({ sort: sort === AdminUserSort.joined_desc ? null : sort, ...RESET_PAGING }),
      }),
    [t, locale, query.sort, update],
  );

  const data = list.data;
  const total = data?.total ?? 0;
  const offset = query.back.length * PAGE_SIZE;
  const from = data && data.items.length > 0 ? offset + 1 : 0;
  const to = data ? offset + data.items.length : 0;
  const filtered = hasActiveFilters(query);

  function clearFilters() {
    setSearch("");
    update({ q: null, status: null, role: null, joined: null, ...RESET_PAGING });
  }

  function goNext() {
    if (!data?.nextCursor) return;
    update({ cursor: data.nextCursor, back: serializeBack([...query.back, query.cursor]) });
  }

  function goPrevious() {
    const previous = query.back[query.back.length - 1];
    if (previous === undefined) return;
    update({ cursor: previous, back: serializeBack(query.back.slice(0, -1)) });
  }

  const [sortColumn, sortDirection] = query.sort.split("_");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("list.title")}
        description={data ? t("list.subtitle", { total: formatNumber(total, locale) }) : t("list.subtitleLoading")}
      />

      <Card className="flex-row flex-wrap items-end gap-3">
        <Field label={t("list.search")} className="min-w-64 flex-1">
          {(control) => (
            <Input
              {...control}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("list.searchPlaceholder")}
              autoComplete="off"
              data-testid="admin.users-search"
            />
          )}
        </Field>
        <Field label={t("list.filters.status")}>
          {(control) => (
            <Select
              {...control}
              value={query.status}
              onChange={(event) => update({ status: event.target.value, ...RESET_PAGING })}
              data-testid="admin.users-filter-status"
            >
              <option value="">{t("list.filters.all")}</option>
              {Object.values(AdminUserStatus).map((status) => (
                <option key={status} value={status}>
                  {t(`status.${status}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t("list.filters.role")}>
          {(control) => (
            <Select
              {...control}
              value={query.role}
              onChange={(event) => update({ role: event.target.value, ...RESET_PAGING })}
              data-testid="admin.users-filter-role"
            >
              <option value="">{t("list.filters.all")}</option>
              {Object.values(Role).map((role) => (
                <option key={role} value={role}>
                  {t(`roles.${role}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t("list.filters.joined")}>
          {(control) => (
            <Select
              {...control}
              value={query.joined}
              onChange={(event) => update({ joined: event.target.value, ...RESET_PAGING })}
              data-testid="admin.users-filter-joined"
            >
              <option value="">{t("list.filters.anyTime")}</option>
              {Object.values(AdminJoinedFilter).map((joined) => (
                <option key={joined} value={joined}>
                  {t(`list.filters.joinedOptions.${joined}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </Card>

      {data && !isOnline ? <p className="text-small text-muted">{tCommon("stale")}</p> : null}

      <Card className="gap-0 p-2">
        {list.isError && !data ? (
          <ErrorState
            title={t("list.errorTitle")}
            description={t("list.errorDescription")}
            onRetry={() => void list.refetch()}
            retrying={list.isFetching}
          />
        ) : list.isPending && !list.isError && !isOnline ? (
          <EmptyState icon={Users} title={t("list.offlineTitle")} description={t("list.offlineDescription")} />
        ) : data && data.items.length === 0 ? (
          filtered ? (
            <EmptyState
              icon={SearchX}
              title={t("list.emptyFilteredTitle")}
              description={t("list.emptyFilteredDescription")}
              action={
                <Button variant="white" onClick={clearFilters} data-testid="admin.users-clear-filters">
                  {t("list.clearFilters")}
                </Button>
              }
            />
          ) : (
            <EmptyState icon={Users} title={t("list.emptyTitle")} description={t("list.emptyDescription")} />
          )
        ) : (
          <DataTable
            testId="admin.users-table"
            caption={t("list.tableCaption")}
            columns={columns}
            data={data?.items ?? []}
            getRowId={(row) => row.id}
            loading={list.isPending}
            sortedColumnId={sortColumn}
            sortDirection={sortDirection === "asc" ? "ascending" : "descending"}
          />
        )}
      </Card>

      {data && data.items.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p data-testid="admin.users-total" role="status" className="text-small text-muted">
            {t("list.showing", {
              from: formatNumber(from, locale),
              to: formatNumber(to, locale),
              total: formatNumber(total, locale),
            })}
          </p>
          <div className="flex gap-3">
            <Button
              variant="white"
              onClick={goPrevious}
              disabled={query.back.length === 0}
              data-testid="admin.users-prev"
            >
              {t("list.previous")}
            </Button>
            <Button variant="white" onClick={goNext} disabled={!data.nextCursor} data-testid="admin.users-next">
              {t("list.next")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
