/// <reference types="vite/client" />
import React from "react";

if (import.meta.env.DEV) {
  (async () => {
    const whyDidYouRender = await import(
      "@welldone-software/why-did-you-render"
    );
    whyDidYouRender.default(React, {
      trackAllPureComponents: true,
      trackHooks: true,
    });
  })();
}
