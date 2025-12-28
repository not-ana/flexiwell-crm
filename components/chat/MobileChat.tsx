"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Paperclip, Mic, Play, Pause, FileText, Image as ImageIcon, Check, CheckCheck } from "lucide-react";

// Message types
type MessageType = "text" | "image" | "file" | "voice";

interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  isSent: boolean; // true = sent by current user, false = received
  isRead?: boolean;
  // For file messages
  fileName?: string;
  fileSize?: string;
  // For voice messages
  duration?: string;
  // For image messages
  imageUrl?: string;
}

interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
}

interface MobileChatProps {
  user: ChatUser;
  messages: Message[];
  onSendMessage: (content: string, type: MessageType) => void;
  onClose?: () => void;
  className?: string;
}

export default function MobileChat({
  user,
  messages,
  onSendMessage,
  onClose,
  className = "",
}: MobileChatProps) {
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Simulate typing indicator (would be connected to real-time in production)
  useEffect(() => {
    const timer = setTimeout(() => setIsTyping(false), 3000);
    return () => clearTimeout(timer);
  }, [isTyping]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim(), "text");
      setInputValue("");
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const dateKey = message.timestamp.toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  const toggleVoicePlayback = (messageId: string) => {
    setPlayingVoiceId(playingVoiceId === messageId ? null : messageId);
  };

  const renderMessage = (message: Message) => {
    const bubbleClasses = message.isSent
      ? "bg-primary-600 text-white ml-auto rounded-2xl rounded-br-md"
      : "bg-gray-100 text-gray-900 mr-auto rounded-2xl rounded-bl-md";

    return (
      <div
        key={message.id}
        className={`flex flex-col ${message.isSent ? "items-end" : "items-start"} mb-3`}
      >
        <div className={`max-w-[80%] ${bubbleClasses} px-4 py-2.5`}>
          {/* Text Message */}
          {message.type === "text" && (
            <p className="text-sm leading-relaxed">{message.content}</p>
          )}

          {/* Image Message */}
          {message.type === "image" && message.imageUrl && (
            <div className="relative">
              <img
                src={message.imageUrl}
                alt="Shared image"
                className="rounded-lg max-w-full h-auto max-h-48 object-cover"
              />
              {message.content && (
                <p className="text-sm mt-2 leading-relaxed">{message.content}</p>
              )}
            </div>
          )}

          {/* File Message */}
          {message.type === "file" && (
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  message.isSent ? "bg-primary-500" : "bg-gray-200"
                }`}
              >
                <FileText
                  className={`w-5 h-5 ${message.isSent ? "text-white" : "text-gray-600"}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{message.fileName}</p>
                <p
                  className={`text-xs ${
                    message.isSent ? "text-primary-200" : "text-gray-500"
                  }`}
                >
                  {message.fileSize}
                </p>
              </div>
            </div>
          )}

          {/* Voice Message */}
          {message.type === "voice" && (
            <div className="flex items-center gap-3 min-w-[180px]">
              <button
                onClick={() => toggleVoicePlayback(message.id)}
                className={`w-9 h-9 rounded-full flex items-center justify-center ${
                  message.isSent ? "bg-primary-500" : "bg-gray-200"
                }`}
              >
                {playingVoiceId === message.id ? (
                  <Pause
                    className={`w-4 h-4 ${message.isSent ? "text-white" : "text-gray-600"}`}
                  />
                ) : (
                  <Play
                    className={`w-4 h-4 ${message.isSent ? "text-white" : "text-gray-600"}`}
                  />
                )}
              </button>
              <div className="flex-1">
                <div
                  className={`h-1 rounded-full ${
                    message.isSent ? "bg-primary-400" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`h-full rounded-full ${
                      message.isSent ? "bg-white" : "bg-primary-600"
                    }`}
                    style={{ width: playingVoiceId === message.id ? "60%" : "0%" }}
                  />
                </div>
              </div>
              <span
                className={`text-xs ${
                  message.isSent ? "text-primary-200" : "text-gray-500"
                }`}
              >
                {message.duration}
              </span>
            </div>
          )}
        </div>

        {/* Timestamp and read status */}
        <div
          className={`flex items-center gap-1 mt-1 px-1 ${
            message.isSent ? "flex-row-reverse" : ""
          }`}
        >
          <span className="text-[10px] text-gray-400">{formatTime(message.timestamp)}</span>
          {message.isSent && (
            message.isRead ? (
              <CheckCheck className="w-3 h-3 text-primary-500" />
            ) : (
              <Check className="w-3 h-3 text-gray-400" />
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 -ml-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
        <div className="relative">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-semibold text-sm">
                {user.name.split(" ").map((n) => n[0]).join("")}
              </span>
            </div>
          )}
          {user.isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
          <p className="text-xs text-gray-500">
            {user.isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
          <div key={dateKey}>
            {/* Date separator */}
            <div className="flex items-center justify-center my-4">
              <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                {formatDate(new Date(dateKey))}
              </span>
            </div>
            {/* Messages for this date */}
            {dateMessages.map(renderMessage)}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-start mb-3">
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Paperclip className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
            />
          </div>
          {inputValue.trim() ? (
            <button
              onClick={handleSend}
              className="p-2.5 bg-primary-600 rounded-full hover:bg-primary-700 transition-colors"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          ) : (
            <button className="p-2.5 rounded-full hover:bg-gray-100 transition-colors">
              <Mic className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Export types for use in other components
export type { Message, MessageType, ChatUser, MobileChatProps };
