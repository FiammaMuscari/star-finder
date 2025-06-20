export function Header() {
  return (
    <header className="p-4 h-[80px] rounded-b-lg flex justify-between items-center z-10 sticky top-0 transition-all duration-300">
      <div className="cursor-pointer absolute left-1/2 transform -translate-x-1/2 top-6 text-3xl text-white font-extrabold tracking-wide">
        Star Finder
      </div>
    </header>
  );
}
