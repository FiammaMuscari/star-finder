import { useEffect, useMemo, useRef, useState } from "react";
import type {
  PeriodAvailability,
  TrendingPeriod,
  TrendingRepository,
  TrendingResponse,
} from "../types";

const responseCache = new Map<string, TrendingResponse>();
const EMPTY_PERIOD_AVAILABILITY: PeriodAvailability = {
  today: false,
  week: false,
  month: false,
};

export function useTrendingRepositories(period: TrendingPeriod, language = "") {
  const [repositories, setRepositories] = useState<TrendingRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [periodAvailability, setPeriodAvailability] = useState<PeriodAvailability>(
    EMPTY_PERIOD_AVAILABILITY
  );
  const normalizedLanguage = useMemo(() => {
    return language === "All" ? "" : language.trim();
  }, [language]);
  const requestKey = useMemo(
    () => `${period}:${normalizedLanguage || "__all__"}`,
    [normalizedLanguage, period]
  );
  const activeRequest = useRef(requestKey);

  useEffect(() => {
    let active = true;
    activeRequest.current = requestKey;

    const fetchTrending = async () => {
      try {
        setLoading(true);
        setError(null);

        if (responseCache.has(requestKey)) {
          const cached = responseCache.get(requestKey) as TrendingResponse;

          if (cached.ready) {
            if (!active) {
              return;
            }

            setRepositories(cached.items);
            setMessage(cached.message);
            setPeriodAvailability(cached.periodAvailability);
            setLoading(false);
            return;
          }

          responseCache.delete(requestKey);
        }

        const query = new URLSearchParams({ period });

        if (normalizedLanguage) {
          query.set("language", normalizedLanguage);
        }

        const response = await fetch(`/api/trending?${query.toString()}`);

        if (!response.ok) {
          throw new Error("Unable to load trending repositories right now.");
        }

        const data = (await response.json()) as TrendingResponse;
        if (data.ready) {
          responseCache.set(requestKey, data);
        } else {
          responseCache.delete(requestKey);
        }

        if (!active || activeRequest.current !== requestKey) {
          return;
        }

        setRepositories(data.items);
        setMessage(data.message);
        setPeriodAvailability(data.periodAvailability);
      } catch (err) {
        if (active) {
          setRepositories([]);
          setMessage(null);
          setPeriodAvailability(EMPTY_PERIOD_AVAILABILITY);
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load trending repositories right now."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchTrending();

    return () => {
      active = false;
    };
  }, [normalizedLanguage, period, requestKey]);

  return {
    repositories,
    loading,
    error,
    message,
    periodAvailability,
  };
}
