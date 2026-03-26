import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";

interface LanguageToggleProps {
  onClick?: () => void;
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  onClick,
  className = "",
}) => {
  const { i18n } = useTranslation();

  const toggleLanguage = useCallback(() => {
    const newLang = i18n.language === "es" ? "en" : "es";
    void i18n.changeLanguage(newLang);

    if (onClick) {
      onClick();
    }
  }, [i18n, onClick]);

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`fixed left-4 top-4 z-50 rounded-full border border-white/10 bg-slate-950/55 px-3 py-2 text-sm font-medium text-white transition-all duration-200 backdrop-blur-md ${className}`}
      aria-label="Toggle language between Spanish and English"
    >
      {i18n.language === "es" ? "ES" : "EN"}
    </button>
  );
};
