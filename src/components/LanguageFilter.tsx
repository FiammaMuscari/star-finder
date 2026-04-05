import React, { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGE_COLORS, LANGUAGES } from "../constants";
import type { LanguageFilterProps } from "../types";

export const LanguageFilter: React.FC<LanguageFilterProps> = memo(
  ({ selectedLanguage, onLanguageChange, onLanguagePrefetch }) => {
    const { t } = useTranslation();
    const handleLanguageClick = useCallback(
      (language: string) => {
        onLanguageChange(language);
      },
      [onLanguageChange]
    );
    const handleLanguagePrefetch = useCallback(
      (language: string) => {
        if (language === selectedLanguage) {
          return;
        }

        onLanguagePrefetch?.(language);
      },
      [onLanguagePrefetch, selectedLanguage]
    );
    const languageOptions = ["", ...LANGUAGES];

    return (
      <div className="mx-auto my-4 flex w-full max-w-5xl flex-wrap justify-center gap-2 rounded-[28px] border border-white/10 bg-slate-950/35 p-3 backdrop-blur-md">
        {languageOptions.map((lang) => {
          const isSelected = selectedLanguage === lang;
          const baseClass =
            lang === ""
              ? isSelected
                ? "border-white/70 bg-white text-slate-950 shadow-lg"
                : "border-white/15 bg-white/[0.04] text-white/80 hover:bg-white/[0.08]"
              : `${LANGUAGE_COLORS[lang]} ${
                  isSelected ? "scale-105 bg-opacity-35 shadow-lg" : "bg-opacity-10 hover:bg-opacity-20"
                }`;

          return (
            <button
              key={lang}
              type="button"
              onClick={() => handleLanguageClick(lang)}
              onMouseEnter={() => handleLanguagePrefetch(lang)}
              onFocus={() => handleLanguagePrefetch(lang)}
              onTouchStart={() => handleLanguagePrefetch(lang)}
              className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-all ${baseClass}`}
            >
              {lang === "" ? t("allLanguages") : lang}
            </button>
          );
        })}
      </div>
    );
  }
);

LanguageFilter.displayName = "LanguageFilter";
