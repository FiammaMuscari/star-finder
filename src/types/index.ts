export type Repository = {
  id: number;
  name: string;
  stargazers_count: number;
  html_url: string;
  language: string;
  description: string;
  created_at: string;
  pushed_at: string;
  owner: {
    avatar_url: string;
  };
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

export type RepositoryListProps = {
  repositories: Repository[];
  loading: boolean;
};
