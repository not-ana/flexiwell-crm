"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SearchIcon, ChevronIcon } from "@/components/icons";
import { getStoredTokens } from "@/lib/api/client";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "admin";
  content: string;
  timestamp: Date;
}

interface SupportConversation {
  _id: string;
  odooClientId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  needsAttention?: boolean;
}

function authFetch(url: string, options: RequestInit = {}) {
  const { accessToken } = getStoredTokens();
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });
}

function formatTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Agora";
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

function formatFullTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SupportInboxPage() {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<SupportConversation | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);

      const response = await authFetch(`/api/support/inbox?${params}`);
      if (!response.ok) throw new Error("Erro ao carregar conversas");

      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation?.messages]);

  // Refresh conversations every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const handleSendReply = async () => {
    if (!selectedConversation || !replyText.trim() || sending) return;

    setSending(true);
    try {
      const response = await authFetch(`/api/support/inbox/${selectedConversation._id}/reply`, {
        method: "POST",
        body: JSON.stringify({ message: replyText }),
      });

      if (!response.ok) throw new Error("Erro ao enviar mensagem");

      const data = await response.json();

      // Update conversation in list
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === selectedConversation._id ? data.conversation : conv
        )
      );

      setSelectedConversation(data.conversation);
      setReplyText("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.userName?.toLowerCase().includes(query) ||
      conv.userEmail?.toLowerCase().includes(query)
    );
  });

  // Sort by most recent message
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    const aTime = new Date(a.updatedAt).getTime();
    const bTime = new Date(b.updatedAt).getTime();
    return bTime - aTime;
  });

  // Count conversations needing attention (last message from user)
  const needsAttentionCount = conversations.filter((conv) => {
    const lastMessage = conv.messages[conv.messages.length - 1];
    return lastMessage?.role === "user";
  }).length;

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
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erro</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button onClick={fetchConversations} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className={`p-4 sm:p-6 border-b border-gray-200 bg-white ${selectedConversation ? "hidden lg:block" : ""}`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Inbox de Suporte</h1>
            <p className="text-gray-600 mt-1 hidden lg:block">
              Todas as conversas dos clientes FlexiWell
            </p>
          </div>
          {needsAttentionCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-orange-100 text-orange-700 rounded-lg">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-sm sm:text-base font-medium">{needsAttentionCount} aguardando</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List */}
        <div className={`w-full lg:w-96 border-r border-gray-200 bg-white flex flex-col ${selectedConversation ? "hidden lg:flex" : "flex"}`}>
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {sortedConversations.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-gray-500">Nenhuma conversa encontrada</p>
              </div>
            ) : (
              sortedConversations.map((conv) => {
                const lastMessage = conv.messages[conv.messages.length - 1];
                const needsReply = lastMessage?.role === "user";
                const initials = conv.userName
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase() || "??";

                return (
                  <button
                    key={conv._id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      selectedConversation?._id === conv._id ? "bg-primary-50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary-700">{initials}</span>
                        </div>
                        {needsReply && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">!</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900 truncate">{conv.userName || "Usuario"}</p>
                          <span className="text-xs text-gray-500">{formatTime(conv.updatedAt)}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{conv.userEmail}</p>
                        <p className="text-sm text-gray-600 truncate mt-1">{lastMessage?.content || "Sem mensagens"}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {needsReply && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                              Aguardando resposta
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Conversation Detail */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col bg-gray-50">
            {/* Conversation Header */}
            <div className="p-3 sm:p-4 bg-white border-b border-gray-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronIcon className="w-5 h-5" direction="left" />
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-700">
                    {selectedConversation.userName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase() || "??"}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedConversation.userName || "Usuario"}</p>
                  <p className="text-sm text-gray-500">{selectedConversation.userEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {conversations.length} conversas
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                      message.role === "user"
                        ? "bg-white border border-gray-200"
                        : message.role === "admin"
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {message.role !== "user" && (
                      <p
                        className={`text-xs font-medium mb-1 ${
                          message.role === "admin" ? "text-green-200" : "text-gray-500"
                        }`}
                      >
                        {message.role === "admin" ? "Voce (Ana Julia)" : "Bot"}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.role === "user"
                          ? "text-gray-400"
                          : message.role === "admin"
                          ? "text-green-200"
                          : "text-gray-500"
                      }`}
                    >
                      {formatFullTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Input */}
            <div className="p-3 sm:p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2 sm:gap-3">
                <input
                  type="text"
                  placeholder="Digite sua resposta..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !sending && handleSendReply()}
                  className="flex-1 px-3 sm:px-4 py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={sending}
                />
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || sending}
                  className="px-4 sm:px-6 py-2.5 bg-green-600 text-white font-medium rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? "..." : "Responder"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500">Selecione uma conversa para ver</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
