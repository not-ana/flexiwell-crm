"use client";

import { useAuth } from "@/contexts/AuthContext";

const CRISP_WEBSITE_ID = "54a8a73f-3041-4397-9c2c-cd9ab41450a5";

export default function SupportPage() {
  const { user } = useAuth();

  // Build Crisp embed URL with user data
  const params = new URLSearchParams();
  if (user?.email) {
    params.set("user_email", user.email);
  }
  if (user?.name) {
    params.set("user_nickname", user.name);
  }

  const iframeSrc = `https://go.crisp.chat/chat/embed/?website_id=${CRISP_WEBSITE_ID}${params.toString() ? "&" + params.toString() : ""}`;

  return (
    <iframe
      src={iframeSrc}
      className="w-full h-full border-0"
      style={{ minHeight: "100vh" }}
      allow="camera; microphone; fullscreen"
      title="FlexiWell Support Chat"
    />
  );
}
