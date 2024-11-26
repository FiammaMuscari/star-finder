import React, { useState, useEffect } from "react";

const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      // Mostrar el botón tan pronto como se haga scroll hacia abajo
      if (window.scrollY > 0) {
        setIsVisible(true); // Muestra el botón cuando se hace scroll
      } else {
        setIsVisible(false); // Oculta el botón cuando está en la parte superior
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleClick = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // Agrega desplazamiento suave
    });
  };

  if (!isVisible) return null; // No renderiza el botón si no es visible

  return (
    <button
      onClick={handleClick}
      className="fixed p-8 bottom-6 right-6  bg-black text-white rounded-full shadow-lg transition-opacity duration-300 hover:opacity-80 z-20 flex items-center justify-center"
      aria-label="Scroll to top"
    >
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
    </button>
  );
};

export default ScrollToTopButton;
