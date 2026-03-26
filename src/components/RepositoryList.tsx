import React, { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { RepositoryListProps } from "../types";
import { RepositoryCard } from "./RepositoryCard";

export const RepositoryList: React.FC<RepositoryListProps> = memo(
  ({ repositories, loading, loadMore, hasMore, totalCount }) => {
    const { t } = useTranslation();
    const shownCount = repositories.length;
    const formattedShownCount = new Intl.NumberFormat().format(shownCount);
    const formattedTotalCount = new Intl.NumberFormat().format(totalCount);

    const loadingContent = useMemo(
      () => (
        <div className="flex min-h-[180px] w-full flex-col items-center justify-center gap-3 py-4">
          <img src="/octo-loading.gif" alt="octocat loading" className="w-20" />
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-500 border-t-transparent" />
        </div>
      ),
      []
    );

    const repositoryGrid = useMemo(
      () => (
        <div className="grid w-full gap-4 lg:grid-cols-2">
          {repositories.map((repo) => (
            <div key={repo.id} className="min-w-0">
              <RepositoryCard repo={repo} />
            </div>
          ))}
        </div>
      ),
      [repositories]
    );

    if (loading && repositories.length === 0) {
      return loadingContent;
    }

    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <div className="flex min-h-[24px] justify-end">
          {shownCount > 0 && (
            <p className="text-sm text-slate-300">
              {t("showingResults", {
                shown: formattedShownCount,
                total: formattedTotalCount,
              })}
            </p>
          )}
        </div>

        {shownCount === 0 ? (
          <div className="rounded-[28px] border border-white/10 bg-slate-950/35 px-4 py-8 text-center text-slate-300">
            {t("noResults")}
          </div>
        ) : (
          repositoryGrid
        )}
        {loading && repositories.length > 0 && loadingContent}

        <div className="flex justify-center pb-2 pt-1">
          {hasMore ? (
            <button
              type="button"
              onClick={loadMore}
              disabled={loading}
              className="w-full max-w-sm rounded-2xl border border-cyan-300/30 bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? t("loading") : t("loadMore")}
            </button>
          ) : (
            shownCount > 0 && <p className="text-sm text-slate-400">{t("endOfResults")}</p>
          )}
        </div>
      </section>
    );
  }
);

RepositoryList.displayName = "RepositoryList";
