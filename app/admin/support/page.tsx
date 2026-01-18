"use client";

import { CrispChat } from "@/components/chat";

export default function SupportPage() {
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 min-h-0">
        <CrispChat />
      </div>
    </div>
  );
}
