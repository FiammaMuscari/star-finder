import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGE_COLORS } from "../constants";
import { useTrendingRepositories } from "../hooks/useTrendingRepositories";
import type { TrendingPeriod, TrendingRepository } from "../types";

const PERIODS: Array<{ labelKey: string; value: TrendingPeriod }> = [
  { labelKey: "trendingToday", value: "today" },
  { labelKey: "trendingWeek", value: "week" },
  { labelKey: "trendingMonth", value: "month" },
];

const emptyStateKeyByPeriod: Record<TrendingPeriod, string> = {
  today: "trendingCollectingToday",
  week: "trendingCollectingWeek",
  month: "trendingCollectingMonth",
};

function getRepositoryName(repo: TrendingRepository) {
  return repo.repo_full_name.split("/")[1] || repo.repo_full_name;
}

function getRepositoryOwner(repo: TrendingRepository) {
  return repo.repo_full_name.split("/")[0] || repo.repo_full_name;
}

function formatCompactMetric(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  }

  return value.toString();
}

function getGrowthBadgeClass(growth: number | null) {
  if (growth === null) {
    return "text-slate-400";
  }

  if (growth >= 500) {
    return "text-emerald-300";
  }

  if (growth >= 100) {
    return "text-cyan-300";
  }

  return "text-slate-200";
}

function getLanguageTagClass(language: string | null | undefined) {
  if (!language || !LANGUAGE_COLORS[language]) {
    return "border border-white/10 bg-white/[0.04] text-slate-300";
  }

  return `border ${LANGUAGE_COLORS[language]} bg-opacity-10`;
}

function getAvatarTone(owner: string) {
  const tones = [
    "bg-cyan-300/15 text-cyan-200",
    "bg-emerald-300/15 text-emerald-200",
    "bg-amber-300/15 text-amber-200",
    "bg-pink-300/15 text-pink-200",
    "bg-blue-300/15 text-blue-200",
  ];
  const index = owner
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0) % tones.length;

  return tones[index];
}

type TrendingPreviewSectionProps = {
  selectedLanguage: string;
};

export function TrendingPreviewSection({ selectedLanguage }: TrendingPreviewSectionProps) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<TrendingPeriod>("today");
  const {
    repositories,
    loading,
    error,
    message,
    periodAvailability,
  } = useTrendingRepositories(period, selectedLanguage);
  const topRepositories = repositories.slice(0, 10);
  const visiblePeriods = PERIODS.filter((item) => periodAvailability[item.value]);
  const desktopColumns = [
    topRepositories.slice(0, 5),
    topRepositories.slice(5, 10),
  ];

  useEffect(() => {
    if (visiblePeriods.length === 0) {
      return;
    }

    const currentPeriodVisible = visiblePeriods.some((item) => item.value === period);

    if (!currentPeriodVisible) {
      setPeriod(visiblePeriods[0].value);
    }
  }, [period, visiblePeriods]);

  const renderRepositoryRow = (repo: TrendingRepository, index: number) => (
    <li
      key={`${repo.repo_full_name}:${repo.captured_at}`}
      className="grid grid-cols-[1rem_2rem_minmax(0,1fr)_auto_auto] items-center gap-x-2 py-2 md:grid-cols-[1rem_2rem_minmax(0,1fr)_auto_auto_auto]"
    >
      <div className="flex h-6 min-w-4 items-center justify-center text-[11px] font-semibold text-slate-500">
        {index + 1}
      </div>

      <div
        className={`relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold ${getAvatarTone(
          getRepositoryOwner(repo)
        )}`}
      >
        <img
          src={`https://github.com/${getRepositoryOwner(repo)}.png?size=40`}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="min-w-0">
        <a
          href={`https://github.com/${repo.repo_full_name}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate pr-2 text-sm font-semibold leading-tight text-white transition-colors hover:text-cyan-300"
          title={repo.repo_full_name}
        >
          {getRepositoryName(repo)}
        </a>
      </div>

      {repo.language && (
        <span
          className={`hidden md:inline-flex items-center justify-self-end whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-medium ${getLanguageTagClass(
            repo.language
          )}`}
        >
          {repo.language}
        </span>
      )}

      <span className="inline-flex items-center justify-self-end gap-1 whitespace-nowrap text-[11px] text-white tabular-nums">
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3.5 w-3.5 text-amber-300"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.075 3.31a1 1 0 00.95.69h3.48c.969 0 1.371 1.24.588 1.81l-2.816 2.046a1 1 0 00-.364 1.118l1.076 3.31c.3.922-.755 1.688-1.54 1.118l-2.816-2.046a1 1 0 00-1.176 0l-2.816 2.046c-.784.57-1.838-.196-1.539-1.118l1.075-3.31a1 1 0 00-.364-1.118L2.456 8.737c-.783-.57-.38-1.81.588-1.81h3.48a1 1 0 00.95-.69l1.075-3.31z" />
        </svg>
        <span className="font-semibold">{formatCompactMetric(repo.stars)}</span>
      </span>

      {repo.growth === null ? (
        <span
          className={`justify-self-end whitespace-nowrap text-[11px] font-medium tabular-nums ${getGrowthBadgeClass(
            repo.growth
          )}`}
        >
          ...
        </span>
      ) : (
        <span
          className={`justify-self-end whitespace-nowrap text-[11px] font-semibold tabular-nums ${getGrowthBadgeClass(
            repo.growth
          )}`}
        >
          +{repo.growth.toLocaleString()}
        </span>
      )}
    </li>
  );

  return (
    <section className="mx-auto w-full max-w-full rounded-[24px] border border-white/10 bg-slate-950/35 p-3 sm:p-4 lg:max-w-[44rem] xl:max-w-[48rem]">
      <div className="flex flex-col items-center gap-2.5 text-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
            {t("trendingSectionEyebrow")}
          </p>
          <h2 className="mt-1 text-base font-semibold text-white sm:text-lg">
            {t("trendingSectionTitle")}
          </h2>
        </div>

        {visiblePeriods.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {visiblePeriods.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setPeriod(item.value)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors sm:text-xs ${
                  period === item.value
                    ? "bg-white text-slate-950"
                    : "bg-slate-900/70 text-slate-200 hover:bg-slate-800"
                }`}
              >
                {t(item.labelKey)}
              </button>
            ))}
          </div>
        )}

        <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-3 py-1.5 text-[11px] font-medium text-slate-200">
          <span className="text-slate-300">{t("language")}:</span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] ${
              selectedLanguage
                ? getLanguageTagClass(selectedLanguage)
                : "border border-white/10 bg-white/[0.04] text-slate-200"
            }`}
          >
            {selectedLanguage || t("allLanguages")}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[96px] items-center justify-center">
          <div
            className="h-6 w-6 animate-spin rounded-full border-2 border-white/15 border-t-cyan-300"
            aria-label={t("trendingLoading")}
            role="status"
          />
        </div>
      ) : error ? (
        <div className="mt-2.5 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : topRepositories.length === 0 ? (
        <div className="mt-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-4 text-sm text-slate-300">
          {(message ? t(message) : null) ||
            (!selectedLanguage
              ? t(emptyStateKeyByPeriod[period])
              : t("trendingNoLanguageResults", { language: selectedLanguage }))}
        </div>
      ) : (
        <>
          <ol className="mt-2.5 divide-y divide-white/10 md:hidden">
            {topRepositories.map((repo, index) => renderRepositoryRow(repo, index))}
          </ol>

          <div className="mt-2.5 hidden md:grid md:grid-cols-2 md:gap-x-5">
            {desktopColumns.map((column, columnIndex) => (
              <ol key={`column-${columnIndex}`} className="divide-y divide-white/10">
                {column.map((repo, index) =>
                  renderRepositoryRow(repo, columnIndex * 5 + index)
                )}
              </ol>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
