"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronIcon, SearchIcon } from "@/components/icons";
import type { Conversation } from "@/lib/db/schemas";

interface DisplayConversation extends Omit<Conversation, "_id"> {
  _id: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

function formatTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Now";
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

function formatFullTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function transformConversation(conv: Conversation & { _id: { toString: () => string } }): DisplayConversation {
  const lastMsg = conv.messages[conv.messages.length - 1];
  return {
    ...conv,
    _id: conv._id.toString(),
    lastMessage: lastMsg?.content || "",
    lastMessageTime: lastMsg?.timestamp ? new Date(lastMsg.timestamp) : new Date(conv.updatedAt),
    unreadCount: conv.context?.awaitingResponse ? 1 : 0,
  };
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<DisplayConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({ active: 0, closed: 0, unread: 0 });

  const [selectedConversation, setSelectedConversation] = useState<DisplayConversation | null>(null);
  const [replyText, setReplyText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "closed">("all");
  const [filterPlatform, setFilterPlatform] = useState<"all" | "whatsapp" | "instagram">("all");

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterPlatform !== "all") params.set("platform", filterPlatform);
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/conversations?${params}`);
      if (!response.ok) throw new Error("Failed to fetch conversations");

      const data = await response.json();
      setConversations(data.conversations.map(transformConversation));
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPlatform, searchQuery]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const filteredConversations = conversations;

  const handleSendReply = async () => {
    if (!selectedConversation || !replyText.trim()) return;

    setActionLoading(true);
    try {
      // Use the send endpoint to deliver to platform (WhatsApp/Instagram)
      const response = await fetch(`/api/conversations/${selectedConversation._id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyText,
          from: "admin",
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const data = await response.json();

      // Show warning if delivery failed
      if (data.warning) {
        console.warn("Delivery warning:", data.warning);
      }

      const updated = transformConversation(data.conversation);

      setConversations((prev) =>
        prev.map((conv) => (conv._id === updated._id ? updated : conv))
      );
      setSelectedConversation(updated);
      setReplyText("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseConversation = async () => {
    if (!selectedConversation) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/conversations/${selectedConversation._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close" }),
      });

      if (!response.ok) throw new Error("Failed to close conversation");

      const data = await response.json();
      const updated = transformConversation(data.conversation);

      setConversations((prev) =>
        prev.map((conv) => (conv._id === updated._id ? updated : conv))
      );
      setSelectedConversation(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to close conversation");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <svg className="w-12 h-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading conversations</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button onClick={fetchConversations} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header - Hidden on mobile/tablet when conversation is selected */}
      <div className={`p-4 sm:p-6 border-b border-gray-200 bg-white ${selectedConversation ? "hidden lg:block" : ""}`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Bot Conversations</h1>
            <p className="text-gray-600 mt-1 hidden lg:block">Manage WhatsApp and Instagram conversations</p>
          </div>
          {stats.unread > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-orange-100 text-orange-700 rounded-lg">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-sm sm:text-base font-medium">{stats.unread} awaiting response</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List - Full width on mobile/tablet, hidden when conversation selected */}
        <div className={`w-full lg:w-96 border-r border-gray-200 bg-white flex flex-col ${selectedConversation ? "hidden lg:flex" : "flex"}`}>
          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value as typeof filterPlatform)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Platforms</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-gray-500">No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv._id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    selectedConversation?._id === conv._id ? "bg-primary-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary-700">
                          {conv.clientName.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                      {/* Platform badge */}
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                        conv.platform === "whatsapp" ? "bg-green-500" : "bg-gradient-to-br from-primary-500 to-pink-500"
                      }`}>
                        {conv.platform === "whatsapp" ? (
                          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 truncate">{conv.clientName}</p>
                        <span className="text-xs text-gray-500">{formatTime(conv.lastMessageTime)}</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-0.5">{conv.lastMessage}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          conv.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                        }`}>
                          {conv.status === "active" ? "Active" : "Closed"}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="w-5 h-5 bg-primary-600 text-white text-xs font-medium rounded-full flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Conversation Detail - Full screen on mobile/tablet */}
        {selectedConversation ? (
          <div className={`flex-1 flex flex-col bg-gray-50 ${selectedConversation ? "flex" : "hidden lg:flex"}`}>
            {/* Conversation Header */}
            <div className="p-3 sm:p-4 bg-white border-b border-gray-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Back button - mobile/tablet only */}
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronIcon className="w-5 h-5" direction="left" />
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-700">
                    {selectedConversation.clientName.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedConversation.clientName}</p>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      selectedConversation.platform === "whatsapp" ? "bg-green-500" : "bg-primary-500"
                    }`} />
                    <span className="text-sm text-gray-500 capitalize">{selectedConversation.platform}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <a
                  href={`/admin/clients?id=${selectedConversation.clientId}`}
                  className="px-2 lg:px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg whitespace-nowrap"
                >
                  <span className="hidden lg:inline">View Profile</span>
                  <span className="lg:hidden">Profile</span>
                </a>
                {selectedConversation.status !== "closed" && (
                  <button
                    onClick={handleCloseConversation}
                    disabled={actionLoading}
                    className="px-2 sm:px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.from === "client" ? "justify-start" : "justify-end"}`}
                >
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                    message.from === "client"
                      ? "bg-white border border-gray-200"
                      : message.from === "bot"
                      ? "bg-gray-200 text-gray-800"
                      : "bg-primary-600 text-white"
                  }`}>
                    {message.from !== "client" && (
                      <p className={`text-xs font-medium mb-1 ${
                        message.from === "bot" ? "text-gray-500" : "text-primary-200"
                      }`}>
                        {message.from === "bot" ? "Bot" : "Admin"}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.from === "client" ? "text-gray-400" :
                      message.from === "bot" ? "text-gray-500" : "text-primary-200"
                    }`}>
                      {formatFullTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            {selectedConversation.status !== "closed" && (
              <div className="p-3 sm:p-4 bg-white border-t border-gray-200">
                <div className="flex gap-2 sm:gap-3">
                  <input
                    type="text"
                    placeholder="Message"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !actionLoading && handleSendReply()}
                    className="flex-1 px-3 sm:px-4 py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || actionLoading}
                    className="px-4 sm:px-6 py-2.5 bg-primary-600 text-white font-medium rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading ? "..." : "Send"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500">Select a conversation to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
