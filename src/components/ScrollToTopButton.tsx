import React, { memo, useCallback, useEffect, useMemo, useState } from "react";

const ScrollToTopButton: React.FC = memo(() => {
  const [isVisible, setIsVisible] = useState(false);

  const handleScroll = useCallback(() => {
    setIsVisible(window.scrollY > 300);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  const handleClick = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  const buttonContent = useMemo(
    () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="white"
        className="w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m4.5 15.75 7.5-7.5 7.5 7.5"
        />
      </svg>
    ),
    []
  );

  if (!isVisible) return null;

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-5 right-4 z-30 flex items-center justify-center rounded-full bg-slate-950/85 p-4 text-white shadow-lg backdrop-blur transition-opacity duration-300 hover:opacity-80 sm:bottom-6 sm:right-6"
      aria-label="Scroll to top"
    >
      {buttonContent}
    </button>
  );
});

ScrollToTopButton.displayName = "ScrollToTopButton";

export default ScrollToTopButton;
