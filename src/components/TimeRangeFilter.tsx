import React from "react";
import { TIME_RANGES } from "../constants";
import type { TimeRangeFilterProps } from "../types";
import DateModeSwitch from "./DateModeSwitch";

export const TimeRangeFilter: React.FC<TimeRangeFilterProps> = ({
  selectedRange,
  filterMode,
  onRangeSelect,
  onModeToggle,
}) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 my-4">
      <div className="flex gap-4 flex-wrap justify-center">
        {TIME_RANGES.map((range) => (
          <button
            key={range.value}
            onClick={() => onRangeSelect(range.value)}
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
};
