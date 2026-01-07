"use client";

import { useState, useEffect, useCallback } from "react";
import type { SupportTicket } from "@/lib/db/schemas";

interface DisplayTicket extends Omit<SupportTicket, "_id"> {
  _id: string;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

type FilterStatus = "all" | "open" | "in_progress" | "resolved" | "closed";

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<DisplayTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({ open: 0, in_progress: 0, resolved: 0, closed: 0 });

  const [selectedTicket, setSelectedTicket] = useState<DisplayTicket | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [replyText, setReplyText] = useState("");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);

      const response = await fetch(`/api/support?${params}`);
      if (!response.ok) throw new Error("Failed to fetch tickets");

      const data = await response.json();
      setTickets(data.tickets.map((t: SupportTicket & { _id: { toString: () => string } }) => ({
        ...t,
        _id: t._id.toString(),
      })));
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filteredTickets = tickets;

  const handleStatusChange = async (ticketId: string, newStatus: "open" | "in_progress" | "resolved" | "closed") => {
    setActionLoading(true);
    try {
      const actionMap: Record<string, string> = {
        open: "reopen",
        in_progress: "assign",
        resolved: "resolve",
        closed: "close",
      };

      const response = await fetch(`/api/support/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionMap[newStatus] }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      const data = await response.json();
      const updated = { ...data.ticket, _id: data.ticket._id.toString() };

      setTickets(prev => prev.map(t => t._id === ticketId ? updated : t));
      if (selectedTicket?._id === ticketId) {
        setSelectedTicket(updated);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/support/${selectedTicket._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reply: {
            from: "admin",
            content: replyText,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to send reply");

      const data = await response.json();
      const updated = { ...data.ticket, _id: data.ticket._id.toString() };

      setTickets(prev => prev.map(t => t._id === updated._id ? updated : t));
      setSelectedTicket(updated);
      setReplyText("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send reply");
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading tickets</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button onClick={fetchTickets} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          Try Again
        </button>
      </div>
    );
  }

  const openCount = stats.open;
  const inProgressCount = stats.in_progress;
  const resolvedCount = stats.resolved;

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="p-4 sm:p-8 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Support Tickets</h1>
            <p className="text-gray-600 mt-1 hidden sm:block">Manage and respond to client and teacher requests</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm text-green-600 font-medium">Online</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <button
            onClick={() => setFilterStatus("all")}
            className={`p-3 sm:p-4 rounded-xl border transition-colors ${filterStatus === "all" ? "border-primary-500 bg-primary-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
          >
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{tickets.length}</p>
            <p className="text-xs sm:text-sm text-gray-600">Total</p>
          </button>
          <button
            onClick={() => setFilterStatus("open")}
            className={`p-3 sm:p-4 rounded-xl border transition-colors ${filterStatus === "open" ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
          >
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{openCount}</p>
            <p className="text-xs sm:text-sm text-gray-600">Open</p>
          </button>
          <button
            onClick={() => setFilterStatus("in_progress")}
            className={`p-3 sm:p-4 rounded-xl border transition-colors ${filterStatus === "in_progress" ? "border-yellow-500 bg-yellow-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
          >
            <p className="text-xl sm:text-2xl font-bold text-yellow-600">{inProgressCount}</p>
            <p className="text-xs sm:text-sm text-gray-600">In Progress</p>
          </button>
          <button
            onClick={() => setFilterStatus("resolved")}
            className={`p-3 sm:p-4 rounded-xl border transition-colors ${filterStatus === "resolved" ? "border-green-500 bg-green-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
          >
            <p className="text-xl sm:text-2xl font-bold text-green-600">{resolvedCount}</p>
            <p className="text-xs sm:text-sm text-gray-600">Resolved</p>
          </button>
        </div>
      </div>

      {/* Tickets List and Detail */}
      <div className="flex-1 flex overflow-hidden px-4 sm:px-8 pb-4 sm:pb-8 gap-4 sm:gap-6">
        {/* Tickets List */}
        <div className={`w-full lg:w-[400px] flex-shrink-0 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col ${selectedTicket ? "hidden lg:flex" : "flex"}`}>
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <p className="text-sm font-medium text-gray-700">
              {filterStatus === "all" ? "All Tickets" :
               filterStatus === "open" ? "Open Tickets" :
               filterStatus === "in_progress" ? "In Progress" : "Resolved Tickets"}
              <span className="text-gray-400 ml-1">({filteredTickets.length})</span>
            </p>
          </div>
          <div className="flex-1 overflow-auto divide-y divide-gray-100">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-gray-500">No tickets found</p>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <button
                  key={ticket._id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${selectedTicket?._id === ticket._id ? "bg-primary-50 border-l-4 border-l-primary-500" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100 text-blue-700">
                      <span className="text-sm font-semibold">{getInitials(ticket.clientName)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                          ticket.priority === "urgent" ? "bg-red-100 text-red-700" :
                          ticket.priority === "high" ? "bg-orange-100 text-orange-700" :
                          ticket.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {ticket.priority}
                        </span>
                        <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                          ticket.status === "open" ? "bg-blue-100 text-blue-700" :
                          ticket.status === "in_progress" ? "bg-yellow-100 text-yellow-700" :
                          ticket.status === "resolved" ? "bg-green-100 text-green-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {ticket.status === "in_progress" ? "in progress" : ticket.status}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 truncate">{ticket.subject}</p>
                      <p className="text-sm text-gray-500 truncate">{ticket.clientName}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(ticket.updatedAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Ticket Detail */}
        {selectedTicket ? (
          <div className={`flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col ${selectedTicket ? "flex" : "hidden lg:flex"}`}>
            {/* Ticket Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  {/* Back button for mobile */}
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="lg:hidden mb-2 text-sm text-primary-600 font-medium"
                  >
                    &larr; Back to tickets
                  </button>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm text-gray-500 capitalize">{selectedTicket.category}</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 truncate">{selectedTicket.subject}</h2>
                  <p className="text-sm text-gray-600 mt-1 truncate">
                    From: {selectedTicket.clientName} ({selectedTicket.clientEmail || "No email"})
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(selectedTicket._id, e.target.value as "open" | "in_progress" | "resolved" | "closed")}
                    disabled={actionLoading}
                    className={`px-2 sm:px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                      selectedTicket.status === "open" ? "bg-blue-50 border-blue-200 text-blue-700" :
                      selectedTicket.status === "in_progress" ? "bg-yellow-50 border-yellow-200 text-yellow-700" :
                      selectedTicket.status === "resolved" ? "bg-green-50 border-green-200 text-green-700" :
                      "bg-gray-50 border-gray-200 text-gray-700"
                    } disabled:opacity-50`}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
              {selectedTicket.messages?.map((message) => (
                <div key={message.id} className={`flex ${message.from === "admin" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] sm:max-w-[70%] ${message.from === "admin" ? "order-2" : ""}`}>
                    <div className={`rounded-xl px-4 py-3 ${
                      message.from === "admin" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-900"
                    }`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <p className={`text-xs mt-1 ${message.from === "admin" ? "text-right" : ""} text-gray-400`}>
                      {message.from === "admin" ? "Admin" : selectedTicket.clientName} • {formatDate(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Box */}
            {selectedTicket.status !== "closed" && (
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-2 sm:gap-3">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    onKeyDown={(e) => e.key === "Enter" && !actionLoading && handleSendReply()}
                    className="flex-1 px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || actionLoading}
                    className="px-4 sm:px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? "..." : "Send"}
                  </button>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button
                    onClick={() => handleStatusChange(selectedTicket._id, "resolved")}
                    disabled={actionLoading || selectedTicket.status === "resolved"}
                    className="px-3 py-1.5 text-sm font-medium text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
                  >
                    Mark Resolved
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedTicket._id, "in_progress")}
                    disabled={actionLoading || selectedTicket.status === "in_progress"}
                    className="px-3 py-1.5 text-sm font-medium text-yellow-600 border border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors disabled:opacity-50"
                  >
                    Mark In Progress
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 bg-white border border-gray-200 rounded-xl items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-gray-500">Select a ticket to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
