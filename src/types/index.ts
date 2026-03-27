export type Repository = {
  id: number;
  name: string;
  stargazers_count: number;
  html_url: string;
  language: string;
  description: string | null;
  created_at: string;
  pushed_at: string;
  owner: {
    avatar_url: string;
    login: string;
  };
};

export type TrendingPeriod = "today" | "week" | "month";

export type TrendingRepository = {
  repo_full_name: string;
  stars: number;
  growth: number | null;
  description?: string | null;
  language?: string | null;
  captured_at: string;
};

export type PeriodAvailability = Record<TrendingPeriod, boolean>;

export type TrendingResponse = {
  period: TrendingPeriod;
  days: number;
  ready: boolean;
  message: string | null;
  periodAvailability: PeriodAvailability;
  items: TrendingRepository[];
};

export type FilterState = {
  language: string;
  timeRange: string;
  filterMode: "created" | "updated";
  searchQuery: string;
};

export type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
};

export type LanguageFilterProps = {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
};

export type TimeRangeFilterProps = {
  selectedRange: string;
  filterMode: "created" | "updated";
  onRangeSelect: (range: string) => void;
  onModeToggle: () => void;
};

export type DateModeSwitchProps = {
  filterMode: "created" | "updated";
  onToggle: () => void;
};

export type RepositoryListProps = {
  repositories: Repository[];
  loading: boolean;
  loadMore: () => void;
  hasMore: boolean;
  totalCount: number;
};
