import React from "react";

type DateModeSwitchProps = {
  filterMode: "created" | "updated";
  onToggle: () => void;
};

const DateModeSwitch: React.FC<DateModeSwitchProps> = ({
  filterMode,
  onToggle,
}) => {
  return (
    <div className="flex items-center m-4">
      <span className="mr-2 text-sm">Created</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={filterMode === "updated"}
          onChange={onToggle}
        />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer-focus:ring-4 peer-focus:ring-blue-300 dark:bg-gray-700 peer-checked:bg-blue-600 transition-colors duration-300"></div>
        <span className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 peer-checked:translate-x-full"></span>
      </label>
      <span className="ml-2 text-sm">Updated</span>
    </div>
  );
};

export default DateModeSwitch;
