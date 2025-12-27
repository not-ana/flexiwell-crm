"use client";

import { useState } from "react";
import { ChevronIcon, SearchIcon, FilterIcon } from "@/components/icons";

interface Message {
  id: string;
  from: "client" | "bot" | "admin";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  platform: "whatsapp" | "instagram";
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  status: "active" | "waiting" | "closed";
  messages: Message[];
}

// Mock data
const mockConversations: Conversation[] = [
  {
    id: "1",
    clientId: "c1",
    clientName: "Maria Silva",
    platform: "whatsapp",
    lastMessage: "Obrigada! Consegui agendar minha aula.",
    lastMessageTime: new Date(Date.now() - 5 * 60 * 1000),
    unreadCount: 0,
    status: "active",
    messages: [
      { id: "m1", from: "client", content: "Oi, quantas aulas eu ainda tenho?", timestamp: new Date(Date.now() - 30 * 60 * 1000) },
      { id: "m2", from: "bot", content: "Olá Maria! Você tem 6 aulas restantes no seu plano mensal.", timestamp: new Date(Date.now() - 29 * 60 * 1000) },
      { id: "m3", from: "client", content: "Quero agendar uma aula de pilates", timestamp: new Date(Date.now() - 25 * 60 * 1000) },
      { id: "m4", from: "bot", content: "Claro! Temos as seguintes aulas de Pilates disponíveis:\n1. Terça 10h - Prof. Ana\n2. Quarta 14h - Prof. Maria\n3. Sexta 9h - Prof. Ana", timestamp: new Date(Date.now() - 24 * 60 * 1000) },
      { id: "m5", from: "client", content: "1", timestamp: new Date(Date.now() - 20 * 60 * 1000) },
      { id: "m6", from: "bot", content: "Aula agendada com sucesso! Pilates - Terça às 10h com Prof. Ana.", timestamp: new Date(Date.now() - 19 * 60 * 1000) },
      { id: "m7", from: "client", content: "Obrigada! Consegui agendar minha aula.", timestamp: new Date(Date.now() - 5 * 60 * 1000) },
    ],
  },
  {
    id: "2",
    clientId: "c2",
    clientName: "João Santos",
    platform: "instagram",
    lastMessage: "Preciso falar com alguém sobre meu plano",
    lastMessageTime: new Date(Date.now() - 10 * 60 * 1000),
    unreadCount: 2,
    status: "waiting",
    messages: [
      { id: "m1", from: "client", content: "Oi", timestamp: new Date(Date.now() - 15 * 60 * 1000) },
      { id: "m2", from: "bot", content: "Olá João! Como posso ajudar?", timestamp: new Date(Date.now() - 14 * 60 * 1000) },
      { id: "m3", from: "client", content: "Preciso falar com alguém sobre meu plano", timestamp: new Date(Date.now() - 10 * 60 * 1000) },
      { id: "m4", from: "bot", content: "Claro! Um de nossos atendentes irá responder em breve.", timestamp: new Date(Date.now() - 9 * 60 * 1000) },
    ],
  },
  {
    id: "3",
    clientId: "c3",
    clientName: "Ana Oliveira",
    platform: "whatsapp",
    lastMessage: "Perfeito, muito obrigada!",
    lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    unreadCount: 0,
    status: "closed",
    messages: [
      { id: "m1", from: "client", content: "Quero cancelar minha aula de amanhã", timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) },
      { id: "m2", from: "bot", content: "Sua aula de Yoga amanhã às 9h foi cancelada. A aula foi restaurada ao seu pacote.", timestamp: new Date(Date.now() - 2.9 * 60 * 60 * 1000) },
      { id: "m3", from: "client", content: "Perfeito, muito obrigada!", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    ],
  },
  {
    id: "4",
    clientId: "c4",
    clientName: "Carlos Lima",
    platform: "whatsapp",
    lastMessage: "Como faço pra trocar de instrutora?",
    lastMessageTime: new Date(Date.now() - 30 * 60 * 1000),
    unreadCount: 1,
    status: "waiting",
    messages: [
      { id: "m1", from: "client", content: "Como faço pra trocar de instrutora?", timestamp: new Date(Date.now() - 30 * 60 * 1000) },
      { id: "m2", from: "bot", content: "Para solicitar troca de instrutor, por favor descreva o motivo e entraremos em contato.", timestamp: new Date(Date.now() - 29 * 60 * 1000) },
    ],
  },
];

function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Agora";
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

function formatFullTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(mockConversations[1]);
  const [replyText, setReplyText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "waiting" | "active" | "closed">("all");
  const [filterPlatform, setFilterPlatform] = useState<"all" | "whatsapp" | "instagram">("all");

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = conv.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || conv.status === filterStatus;
    const matchesPlatform = filterPlatform === "all" || conv.platform === filterPlatform;
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const waitingCount = conversations.filter((c) => c.status === "waiting").length;

  const handleSendReply = () => {
    if (!selectedConversation || !replyText.trim()) return;

    const newMessage: Message = {
      id: `m${Date.now()}`,
      from: "admin",
      content: replyText,
      timestamp: new Date(),
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              messages: [...conv.messages, newMessage],
              lastMessage: replyText,
              lastMessageTime: new Date(),
              status: "active" as const,
              unreadCount: 0,
            }
          : conv
      )
    );

    setSelectedConversation((prev) =>
      prev
        ? {
            ...prev,
            messages: [...prev.messages, newMessage],
            status: "active",
            unreadCount: 0,
          }
        : null
    );

    setReplyText("");
  };

  const handleCloseConversation = () => {
    if (!selectedConversation) return;

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation.id
          ? { ...conv, status: "closed" as const }
          : conv
      )
    );

    setSelectedConversation((prev) =>
      prev ? { ...prev, status: "closed" } : null
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bot Conversations</h1>
            <p className="text-gray-600 mt-1">Manage WhatsApp and Instagram conversations</p>
          </div>
          {waitingCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="font-medium">{waitingCount} awaiting response</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List */}
        <div className="w-96 border-r border-gray-200 bg-white flex flex-col">
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
                <option value="waiting">Waiting</option>
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
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selectedConversation?.id === conv.id ? "bg-primary-50" : ""
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
                        conv.status === "waiting" ? "bg-orange-100 text-orange-700" :
                        conv.status === "active" ? "bg-green-100 text-green-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {conv.status === "waiting" ? "Waiting" : conv.status === "active" ? "Active" : "Closed"}
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
            ))}
          </div>
        </div>

        {/* Conversation Detail */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col bg-gray-50">
            {/* Conversation Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    // In production: router.push(`/admin/clients/${selectedConversation.clientId}`)
                    alert(`Viewing profile for: ${selectedConversation.clientName}\nClient ID: ${selectedConversation.clientId}`);
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  View Profile
                </button>
                {selectedConversation.status !== "closed" && (
                  <button
                    onClick={handleCloseConversation}
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
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
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                    className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
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
