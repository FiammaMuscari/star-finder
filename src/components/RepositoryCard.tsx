import React from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGE_COLORS } from "../constants";
import type { Repository } from "../types";

function getLanguageTagClass(language: string | null | undefined) {
  if (!language || !LANGUAGE_COLORS[language]) {
    return "border border-slate-200 bg-slate-100 text-slate-700";
  }

  return `border ${LANGUAGE_COLORS[language]} bg-opacity-10`;
}

export const RepositoryCard: React.FC<{ repo: Repository }> = ({ repo }) => {
  const { t } = useTranslation();

  return (
    <article className="h-full rounded-[28px] border border-slate-200/80 bg-white/95 p-4 text-left shadow-[0_18px_40px_rgba(15,23,42,0.18)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(14,165,233,0.22)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <img
            src={repo.owner.avatar_url}
            alt={`${repo.owner.login} avatar`}
            className="h-11 w-11 shrink-0 rounded-2xl border border-slate-200 object-cover sm:h-12 sm:w-12"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {repo.owner.login}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900 sm:text-xl">
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-words text-slate-900 transition-colors hover:text-cyan-700 [overflow-wrap:anywhere]"
              >
                {repo.name}
              </a>
            </h3>
            <p className="mt-2 line-clamp-3 text-sm text-slate-600 sm:text-base [overflow-wrap:anywhere]">
              {repo.description || t("repoDescriptionFallback")}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4 text-amber-400"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.075 3.31a1 1 0 00.95.69h3.48c.969 0 1.371 1.24.588 1.81l-2.816 2.046a1 1 0 00-.364 1.118l1.076 3.31c.3.922-.755 1.688-1.54 1.118l-2.816-2.046a1 1 0 00-1.176 0l-2.816 2.046c-.784.57-1.838-.196-1.539-1.118l1.075-3.31a1 1 0 00-.364-1.118L2.456 8.737c-.783-.57-.38-1.81.588-1.81h3.48a1 1 0 00.95-.69l1.075-3.31z" />
          </svg>
          <span>{repo.stargazers_count.toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500 sm:text-sm">
        {repo.language && (
          <span
            className={`rounded-full px-3 py-1 font-medium ${getLanguageTagClass(
              repo.language
            )}`}
          >
            {repo.language}
          </span>
        )}
        <span className="rounded-full bg-slate-100 px-3 py-1">
          {t("created")}
          {new Date(repo.created_at).toLocaleDateString()}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1">
          {t("updated")} {new Date(repo.pushed_at).toLocaleDateString()}
        </span>
      </div>
    </article>
  );
};
