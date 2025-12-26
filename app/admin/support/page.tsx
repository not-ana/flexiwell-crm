"use client";

import { useState } from "react";

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  priority: "low" | "medium" | "high";
  createdAt: string;
  lastUpdate: string;
  from: {
    name: string;
    email: string;
    type: "client" | "teacher";
    initials: string;
  };
  messages: {
    id: string;
    from: string;
    content: string;
    time: string;
    isAdmin: boolean;
  }[];
}

const mockTickets: Ticket[] = [
  {
    id: "TK-001",
    subject: "Can't access my class schedule",
    description: "I'm trying to view my upcoming classes but the page keeps loading forever. I've tried refreshing and clearing cache but nothing works.",
    status: "open",
    priority: "high",
    createdAt: "Dec 25, 2024 10:30 AM",
    lastUpdate: "Dec 25, 2024 10:30 AM",
    from: { name: "Olivia Rhye", email: "olivia@flexitrack.net", type: "client", initials: "OR" },
    messages: [
      { id: "1", from: "Olivia Rhye", content: "I'm trying to view my upcoming classes but the page keeps loading forever. I've tried refreshing and clearing cache but nothing works.", time: "10:30 AM", isAdmin: false },
    ],
  },
  {
    id: "TK-002",
    subject: "Payment not processing",
    description: "Client tried to pay for Monthly - 12 classes plan but payment keeps failing with error code 402.",
    status: "in_progress",
    priority: "high",
    createdAt: "Dec 24, 2024 2:15 PM",
    lastUpdate: "Dec 24, 2024 4:30 PM",
    from: { name: "Maria Santos", email: "maria@flexiwell.com", type: "teacher", initials: "MS" },
    messages: [
      { id: "1", from: "Maria Santos", content: "Client tried to pay for Monthly - 12 classes plan but payment keeps failing with error code 402.", time: "2:15 PM", isAdmin: false },
      { id: "2", from: "Admin", content: "Thanks for reporting. I'm checking the Stripe integration now. Can you confirm the client's name?", time: "3:00 PM", isAdmin: true },
      { id: "3", from: "Maria Santos", content: "Yes, it's Lucas Ferreira. He tried 3 times with different cards.", time: "4:30 PM", isAdmin: false },
    ],
  },
  {
    id: "TK-003",
    subject: "How to cancel a class?",
    description: "I need to cancel my class on Friday but I can't find the option. Where is it?",
    status: "resolved",
    priority: "low",
    createdAt: "Dec 23, 2024 9:00 AM",
    lastUpdate: "Dec 23, 2024 11:45 AM",
    from: { name: "João Silva", email: "joao@email.com", type: "client", initials: "JS" },
    messages: [
      { id: "1", from: "João Silva", content: "I need to cancel my class on Friday but I can't find the option. Where is it?", time: "9:00 AM", isAdmin: false },
      { id: "2", from: "Admin", content: "Hi João! Go to your Profile > My Scheduled Classes, find the class you want to cancel, and click 'Request Cancel'. Our team will process it within 24h.", time: "10:30 AM", isAdmin: true },
      { id: "3", from: "João Silva", content: "Found it! Thank you so much!", time: "11:45 AM", isAdmin: false },
    ],
  },
  {
    id: "TK-004",
    subject: "Need to change my instructor",
    description: "I'd like to switch from Maria to Carlos for my Pilates classes. Is this possible?",
    status: "open",
    priority: "medium",
    createdAt: "Dec 25, 2024 8:00 AM",
    lastUpdate: "Dec 25, 2024 8:00 AM",
    from: { name: "Ana Costa", email: "ana.costa@email.com", type: "client", initials: "AC" },
    messages: [
      { id: "1", from: "Ana Costa", content: "I'd like to switch from Maria to Carlos for my Pilates classes. Is this possible?", time: "8:00 AM", isAdmin: false },
    ],
  },
];

type FilterStatus = "all" | "open" | "in_progress" | "resolved";

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState(mockTickets);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [replyText, setReplyText] = useState("");

  const filteredTickets = filterStatus === "all"
    ? tickets
    : tickets.filter(t => t.status === filterStatus);

  const openCount = tickets.filter(t => t.status === "open").length;
  const inProgressCount = tickets.filter(t => t.status === "in_progress").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved").length;

  const handleStatusChange = (ticketId: string, newStatus: Ticket["status"]) => {
    setTickets(tickets.map(t =>
      t.id === ticketId ? { ...t, status: newStatus, lastUpdate: "Just now" } : t
    ));
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status: newStatus, lastUpdate: "Just now" });
    }
  };

  const handleSendReply = () => {
    if (!selectedTicket || !replyText.trim()) return;

    const newMessage = {
      id: String(selectedTicket.messages.length + 1),
      from: "Admin",
      content: replyText,
      time: "Just now",
      isAdmin: true,
    };

    const updatedTicket = {
      ...selectedTicket,
      messages: [...selectedTicket.messages, newMessage],
      lastUpdate: "Just now",
      status: selectedTicket.status === "open" ? "in_progress" as const : selectedTicket.status,
    };

    setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
    setSelectedTicket(updatedTicket);
    setReplyText("");
  };

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="p-8 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
            <p className="text-gray-600 mt-1">Manage and respond to client and teacher requests</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm text-green-600 font-medium">Online</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => setFilterStatus("all")}
            className={`p-4 rounded-xl border transition-colors ${filterStatus === "all" ? "border-primary-500 bg-primary-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
          >
            <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
            <p className="text-sm text-gray-600">Total Tickets</p>
          </button>
          <button
            onClick={() => setFilterStatus("open")}
            className={`p-4 rounded-xl border transition-colors ${filterStatus === "open" ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
          >
            <p className="text-2xl font-bold text-blue-600">{openCount}</p>
            <p className="text-sm text-gray-600">Open</p>
          </button>
          <button
            onClick={() => setFilterStatus("in_progress")}
            className={`p-4 rounded-xl border transition-colors ${filterStatus === "in_progress" ? "border-yellow-500 bg-yellow-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
          >
            <p className="text-2xl font-bold text-yellow-600">{inProgressCount}</p>
            <p className="text-sm text-gray-600">In Progress</p>
          </button>
          <button
            onClick={() => setFilterStatus("resolved")}
            className={`p-4 rounded-xl border transition-colors ${filterStatus === "resolved" ? "border-green-500 bg-green-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
          >
            <p className="text-2xl font-bold text-green-600">{resolvedCount}</p>
            <p className="text-sm text-gray-600">Resolved</p>
          </button>
        </div>
      </div>

      {/* Tickets List and Detail */}
      <div className="flex-1 flex overflow-hidden px-8 pb-8 gap-6">
        {/* Tickets List */}
        <div className="w-[400px] flex-shrink-0 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <p className="text-sm font-medium text-gray-700">
              {filterStatus === "all" ? "All Tickets" :
               filterStatus === "open" ? "Open Tickets" :
               filterStatus === "in_progress" ? "In Progress" : "Resolved Tickets"}
              <span className="text-gray-400 ml-1">({filteredTickets.length})</span>
            </p>
          </div>
          <div className="flex-1 overflow-auto divide-y divide-gray-100">
            {filteredTickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${selectedTicket?.id === ticket.id ? "bg-primary-50 border-l-4 border-l-primary-500" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${ticket.from.type === "client" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                    <span className="text-sm font-semibold">{ticket.from.initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                        ticket.priority === "high" ? "bg-red-100 text-red-700" :
                        ticket.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {ticket.priority}
                      </span>
                      <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                        ticket.status === "open" ? "bg-blue-100 text-blue-700" :
                        ticket.status === "in_progress" ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {ticket.status === "in_progress" ? "in progress" : ticket.status}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 truncate">{ticket.subject}</p>
                    <p className="text-sm text-gray-500 truncate">{ticket.from.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{ticket.lastUpdate}</p>
                  </div>
                </div>
              </button>
            ))}
            {filteredTickets.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-gray-500">No tickets found</p>
              </div>
            )}
          </div>
        </div>

        {/* Ticket Detail */}
        {selectedTicket ? (
          <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
            {/* Ticket Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-500">{selectedTicket.id}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      selectedTicket.from.type === "client" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                    }`}>
                      {selectedTicket.from.type}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedTicket.subject}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    From: {selectedTicket.from.name} ({selectedTicket.from.email})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value as Ticket["status"])}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                      selectedTicket.status === "open" ? "bg-blue-50 border-blue-200 text-blue-700" :
                      selectedTicket.status === "in_progress" ? "bg-yellow-50 border-yellow-200 text-yellow-700" :
                      "bg-green-50 border-green-200 text-green-700"
                    }`}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-6 space-y-4">
              {selectedTicket.messages.map((message) => (
                <div key={message.id} className={`flex ${message.isAdmin ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] ${message.isAdmin ? "order-2" : ""}`}>
                    <div className={`rounded-xl px-4 py-3 ${
                      message.isAdmin ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-900"
                    }`}>
                      <p>{message.content}</p>
                    </div>
                    <p className={`text-xs mt-1 ${message.isAdmin ? "text-right" : ""} text-gray-400`}>
                      {message.from} • {message.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Box */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                  className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleStatusChange(selectedTicket.id, "resolved")}
                  className="px-3 py-1.5 text-sm font-medium text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                >
                  Mark as Resolved
                </button>
                <button
                  onClick={() => handleStatusChange(selectedTicket.id, "in_progress")}
                  className="px-3 py-1.5 text-sm font-medium text-yellow-600 border border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors"
                >
                  Mark In Progress
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-white border border-gray-200 rounded-xl flex items-center justify-center">
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
