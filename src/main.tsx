import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./i18n";
import App from "./App.tsx";
// Import why-did-you-render in development
// if (import.meta.env.DEV) {
//   import("./wdyr.ts");
// }

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
