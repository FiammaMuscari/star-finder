import { useTranslation } from "react-i18next";

export const LANGUAGES = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Java",
  "Go",
  "Rust",
  "C++",
  "C#",
  "PHP",
  "Ruby",
] as const;

export const TIME_RANGES = [
  { label: "1 Week", value: "7d" },
  { label: "1 Month", value: "30d" },
  { label: "3 Months", value: "90d" },
  { label: "6 Months", value: "180d" },
  { label: "1 year", value: "365d" },
  { label: "Since GitHub", value: "since_github" },
] as const;

export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "bg-blue-500 border-blue-500 text-blue-500",
  JavaScript: "bg-yellow-400 border-yellow-400 text-yellow-400",
  Python: "bg-blue-300 border-blue-300 text-blue-300",
  Java: "bg-red-600 border-red-600 text-red-600",
  Go: "bg-cyan-500 border-cyan-500 text-cyan-500",
  Rust: "bg-orange-600 border-orange-600 text-orange-600",
  "C++": "bg-purple-600 border-purple-600 text-purple-600",
  "C#": "bg-green-600 border-green-600 text-green-600",
  PHP: "bg-indigo-400 border-indigo-400 text-indigo-400",
  Ruby: "bg-pink-600 border-pink-600 text-pink-600",
};

export const UI_BACKGROUND_ANIMATION = true;

// Hook to get translated time ranges
export const useTranslatedTimeRanges = () => {
  const { t } = useTranslation();

  return TIME_RANGES.map((range) => ({
    ...range,
    label: getTranslatedTimeLabel(range.value, t),
  }));
};

// Helper function to get translated labels
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getTranslatedTimeLabel = (value: string, t: any) => {
  switch (value) {
    case "7d":
      return `1 ${t("week")}`;
    case "30d":
      return `1 ${t("month")}`;
    case "90d":
      return `3 ${t("months")}`;
    case "180d":
      return `6 ${t("months")}`;
    case "365d":
      return `1 ${t("year")}`;
    case "since_github":
      return t("sinceGithub");
    default:
      return value;
  }
};
