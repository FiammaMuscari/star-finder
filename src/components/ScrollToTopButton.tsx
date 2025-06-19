import React, { useState, useEffect, useCallback, useMemo, memo } from "react";

const ScrollToTopButton: React.FC = memo(() => {
  const [isVisible, setIsVisible] = useState(true);

  const handleScroll = useCallback(() => {
    if (window.scrollY > 0) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
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
      className="fixed p-8 bottom-6 right-6  bg-black text-white rounded-full shadow-lg transition-opacity duration-300 hover:opacity-80 z-20 flex items-center justify-center"
      aria-label="Scroll to top"
    >
      {buttonContent}
    </button>
  );
});

ScrollToTopButton.displayName = "ScrollToTopButton";

export default ScrollToTopButton;
