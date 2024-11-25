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
