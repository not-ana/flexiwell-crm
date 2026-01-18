"use client";

import { useAuth } from "@/contexts/AuthContext";

const CRISP_WEBSITE_ID = "54a8a73f-3041-4397-9c2c-cd9ab41450a5";

export default function CrispChat() {
  const { user } = useAuth();

  // Build iframe URL with user data
  const baseUrl = `https://go.crisp.chat/chat/embed/?website_id=${CRISP_WEBSITE_ID}`;

  // Pass user info via URL if available
  const params = new URLSearchParams();
  if (user?.email) {
    params.set("user_email", user.email);
  }
  if (user?.name) {
    params.set("user_nickname", user.name);
  }

  const iframeSrc = params.toString()
    ? `${baseUrl}&${params.toString()}`
    : baseUrl;

  return (
    <iframe
      src={iframeSrc}
      className="w-full h-full border-0"
      allow="camera; microphone; fullscreen"
      title="Support Chat"
    />
  );
}
