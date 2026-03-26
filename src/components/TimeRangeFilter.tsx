import React, { memo, useCallback } from "react";
import type { TimeRangeFilterProps } from "../types";
import { useTranslatedTimeRanges } from "../constants";
import DateModeSwitch from "./DateModeSwitch";

export const TimeRangeFilter: React.FC<TimeRangeFilterProps> = memo(
  ({ selectedRange, filterMode, onRangeSelect, onModeToggle }) => {
    const timeRanges = useTranslatedTimeRanges();

    const handleRangeClick = useCallback(
      (range: string) => {
        onRangeSelect(range);
      },
      [onRangeSelect]
    );

    return (
      <div className="my-4 flex flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-2">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              type="button"
              onClick={() => handleRangeClick(range.value)}
              className={`rounded-2xl px-4 py-2 text-sm transition-colors ${
                selectedRange === range.value
                  ? "bg-white text-slate-950"
                  : "bg-slate-900/70 text-slate-200 hover:bg-slate-800"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
        <DateModeSwitch filterMode={filterMode} onToggle={onModeToggle} />
      </div>
    );
  }
);

TimeRangeFilter.displayName = "TimeRangeFilter";
