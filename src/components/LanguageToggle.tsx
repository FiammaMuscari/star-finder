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
    i18n.changeLanguage(newLang);

    if (onClick) {
      onClick();
    }
  }, [i18n, onClick]);

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`fixed top-4 left-4 z-50  bg-transparent    text-white px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium backdrop-blur-sm ${className}`}
      aria-label="Toggle language between Spanish and English"
    >
      {i18n.language === "es" ? "ES" : "EN"}
    </button>
  );
};
