import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { DateModeSwitchProps } from "../types";

const DateModeSwitch = memo<DateModeSwitchProps>(({ filterMode, onToggle }) => {
  const { t } = useTranslation();

  const handleToggle = useCallback(() => {
    onToggle();
  }, [onToggle]);

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/35 px-3 py-2 text-slate-200">
      <span className="text-sm">{t("created")}</span>
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={filterMode === "updated"}
          onChange={handleToggle}
        />
        <div className="h-6 w-11 rounded-full bg-slate-700 transition-colors duration-300 peer-checked:bg-cyan-400" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300 peer-checked:translate-x-full" />
      </label>
      <span className="text-sm">{t("updated")}</span>
    </div>
  );
});

DateModeSwitch.displayName = "DateModeSwitch";

export default DateModeSwitch;
