"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    $crisp: unknown[];
    CRISP_WEBSITE_ID: string;
  }
}

/**
 * This component hides the Crisp chatbox popup on all pages.
 * The chat is only shown embedded in the Support page.
 */
export function CrispHider() {
  const pathname = usePathname();

  useEffect(() => {
    // Add CSS to hide the Crisp chatbox globally
    const style = document.createElement("style");
    style.id = "crisp-hider-style";
    style.textContent = `
      /* Hide Crisp chatbox button and chat window */
      .crisp-client,
      #crisp-chatbox,
      [data-crisp-chatbox] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `;

    // Only add if not already present
    if (!document.getElementById("crisp-hider-style")) {
      document.head.appendChild(style);
    }

    // Also try to hide via Crisp API if it loads
    const hideCrisp = () => {
      if (typeof window !== "undefined" && window.$crisp) {
        window.$crisp.push(["do", "chat:hide"]);
      }
    };

    // Try immediately and after a delay (in case Crisp loads later)
    hideCrisp();
    const timer1 = setTimeout(hideCrisp, 1000);
    const timer2 = setTimeout(hideCrisp, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [pathname]);

  return null;
}
