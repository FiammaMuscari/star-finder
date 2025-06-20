import React, { useCallback, memo } from "react";
import { useTranslatedTimeRanges } from "../constants";
import type { TimeRangeFilterProps } from "../types";
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
      <div className="flex flex-wrap justify-center gap-4 my-4">
        <div className="flex md:gap-4 gap-2 flex-wrap justify-center">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => handleRangeClick(range.value)}
              className={`px-4 py-2 my-2 rounded-lg transition-colors ${
                selectedRange === range.value
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
