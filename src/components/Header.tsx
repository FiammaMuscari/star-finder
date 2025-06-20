interface HeaderProps {
  currentLanguage: string;
  onToggleLanguage: () => void;
}

export function Header({ currentLanguage, onToggleLanguage }: HeaderProps) {
  return (
    <header className="p-4 h-[80px] rounded-b-lg flex justify-between items-center z-10 sticky top-0 transition-all duration-300">
      <button
        onClick={onToggleLanguage}
        className="absolute top-4 left-4 px-3 py-2 text-white rounded-md transition-colors duration-200"
      >
        {currentLanguage === "es" ? "ES" : "EN"}
      </button>
      <div className="cursor-pointer absolute left-1/2 transform -translate-x-1/2 top-6 text-3xl text-white font-extrabold tracking-wide">
        Star Finder
      </div>
    </header>
  );
}
