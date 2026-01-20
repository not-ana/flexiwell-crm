"use client";

import { useEffect } from "react";

const CRISP_WEBSITE_ID = "54a8a73f-3041-4397-9c2c-cd9ab41450a5";

declare global {
  interface Window {
    $crisp: unknown[];
    CRISP_WEBSITE_ID: string;
  }
}

export function CrispWidget() {
  useEffect(() => {
    // Initialize Crisp
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;

    // Load Crisp script
    const script = document.createElement("script");
    script.src = "https://client.crisp.chat/l.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return null;
}
