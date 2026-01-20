"use client";

import { SupportChat } from "@/components/chat";

export default function SupportPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <SupportChat />
      </div>
    </div>
  );
}
