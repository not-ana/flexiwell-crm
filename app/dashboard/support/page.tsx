"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "support";
  timestamp: string;
  type: "text" | "file";
  fileName?: string;
  fileSize?: string;
  isRead?: boolean;
}

// Mock studio data - in production this would come from the user's context
const mockStudio = {
  name: "Studio Vida",
  initials: "SV",
};

// Mock messages for support chat
const mockMessages: Message[] = [
  {
    id: "1",
    content: `Hello! Welcome to ${mockStudio.name} support. How can we help you today?`,
    sender: "support",
    timestamp: "Yesterday 2:30 PM",
    type: "text",
  },
  {
    id: "2",
    content: "Hi! I have questions about how to book a class.",
    sender: "user",
    timestamp: "Yesterday 2:32 PM",
    type: "text",
  },
  {
    id: "3",
    content: "Of course! To book a class, just go to the 'Classes' tab and choose an available time slot. You'll see all classes open for enrollment.",
    sender: "support",
    timestamp: "Yesterday 2:35 PM",
    type: "text",
  },
  {
    id: "4",
    content: "We've prepared a quick guide for you:",
    sender: "support",
    timestamp: "Yesterday 2:36 PM",
    type: "text",
  },
  {
    id: "5",
    content: "",
    sender: "support",
    timestamp: "Yesterday 2:36 PM",
    type: "file",
    fileName: "Class_Booking_Guide.pdf",
    fileSize: "856 KB",
  },
  {
    id: "6",
    content: "Thank you so much! I'll take a look.",
    sender: "user",
    timestamp: "Yesterday 2:40 PM",
    type: "text",
    isRead: true,
  },
];

function SendIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function EmojiIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}

function AttachIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function DoubleCheckIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 6 9 17 4 12" />
      <polyline points="22 6 13 17" />
    </svg>
  );
}

export default function SupportPage() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: String(Date.now()),
      content: newMessage,
      sender: "user",
      timestamp: "Just now",
      type: "text",
      isRead: false,
    };

    setMessages([...messages, message]);
    setNewMessage("");

    // Simulate support typing
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const supportResponse: Message = {
        id: String(Date.now() + 1),
        content: "Thank you for your message! Our team will respond shortly.",
        sender: "support",
        timestamp: "Just now",
        type: "text",
      };
      setMessages((prev) => [...prev, supportResponse]);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">{mockStudio.initials}</span>
          </div>
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-gray-900">{mockStudio.name}</h1>
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Online
            </span>
          </div>
          <p className="text-sm text-gray-500">Typically responds in a few minutes</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
        {/* Welcome Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-md mx-auto text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">{mockStudio.initials}</span>
            </div>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">How can we help?</h2>
          <p className="text-sm text-gray-500">
            Send your message and our team will respond as soon as possible.
          </p>
        </div>

        {messages.map((message) => {
          const isUser = message.sender === "user";

          return (
            <div key={message.id} className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
              {!isUser && (
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs">{mockStudio.initials}</span>
                </div>
              )}

              <div className={`max-w-md ${isUser ? "text-right" : ""}`}>
                <div className={`flex items-center gap-2 mb-1 ${isUser ? "justify-end" : ""}`}>
                  <span className="text-xs text-gray-500">{message.timestamp}</span>
                  {isUser && message.isRead && (
                    <DoubleCheckIcon className="w-4 h-4 text-primary-600" />
                  )}
                </div>

                {message.type === "text" && (
                  <div
                    className={`inline-block px-4 py-3 rounded-2xl ${
                      isUser
                        ? "bg-primary-600 text-white rounded-tr-sm"
                        : "bg-white text-gray-900 rounded-tl-sm shadow-sm border border-gray-100"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                )}

                {message.type === "file" && (
                  <div className="inline-flex items-center gap-3 px-4 py-3 bg-white rounded-2xl rounded-tl-sm shadow-sm border border-gray-100">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-bold text-red-600">PDF</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{message.fileName}</p>
                      <p className="text-xs text-gray-500">{message.fileSize}</p>
                    </div>
                    <button className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">{mockStudio.initials}</span>
            </div>
            <div className="px-4 py-3 bg-white rounded-2xl rounded-tl-sm shadow-sm border border-gray-100">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white">
        <div className="flex items-end gap-3">
          <label className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">
            <AttachIcon className="w-5 h-5" />
            <input
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Handle file attachment - will integrate with backend
                  console.log("File attached:", file.name);
                  // In production: await api.uploadAttachment(file);
                  alert(`File "${file.name}" attached. File upload will be available soon.`);
                }
                e.target.value = "";
              }}
            />
          </label>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              type="button"
              onClick={() => {
                // Simple emoji picker - in production use a proper emoji picker library
                const emojis = ["😊", "👍", "❤️", "🙏", "👏", "🎉", "💪", "✨"];
                const emoji = emojis[Math.floor(Math.random() * emojis.length)];
                setNewMessage((prev) => prev + emoji);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            >
              <EmojiIcon className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
