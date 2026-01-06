"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    window.location.href = "https://flexiwell.net";
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-gray-600">Redirecting to flexiwell.net...</p>
    </div>
  );
}
