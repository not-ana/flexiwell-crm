"use client";

import { useState } from "react";
import { SearchIcon, ChevronIcon } from "@/components/icons";
import Button from "@/components/ui/Button";

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    category: "Classes",
    question: "How do I cancel a class?",
    answer: "To cancel a class, go to 'My Classes', find the class you want to cancel, and click on it. Then select 'Cancel Class' and provide a reason. All enrolled students will be automatically notified."
  },
  {
    category: "Classes",
    question: "How do I reschedule a class?",
    answer: "Navigate to 'My Classes', select the class you want to reschedule, and click 'Reschedule'. Choose a new date and time from your available slots. Students will receive a notification about the change."
  },
  {
    category: "Classes",
    question: "How do I handle makeup classes?",
    answer: "For makeup classes, you can create a special session through 'My Classes' > 'Add Makeup Class'. Select the students who need the makeup and choose an available time slot."
  },
  {
    category: "Students",
    question: "How can I view a student's attendance history?",
    answer: "Go to 'My Students', click on the student's name, and you'll see their complete attendance history including classes attended, cancellations, and no-shows."
  },
  {
    category: "Students",
    question: "How do I send a message to a student?",
    answer: "From 'My Students', click on the student you want to contact and select 'Send Message'. You can also send group messages to all students in a specific class."
  },
  {
    category: "Schedule",
    question: "How do I update my availability?",
    answer: "Go to 'Settings' > 'Availability' to update your working hours. Changes will apply to future class scheduling. Existing bookings won't be affected."
  },
  {
    category: "Schedule",
    question: "How do I block time off?",
    answer: "In your calendar view, click on the date you want to block and select 'Block Time'. You can block specific hours or entire days. Students won't be able to book during blocked times."
  },
  {
    category: "Payments",
    question: "How do I see my earnings?",
    answer: "Your earnings are visible in the Dashboard. For detailed reports, contact the admin who can provide complete payment history and projections."
  },
];

export default function TeacherSupportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ subject: "", message: "" });

  const categories = ["all", ...Array.from(new Set(faqs.map(f => f.category)))];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    alert("Your message has been sent to the admin team!");
    setContactForm({ subject: "", message: "" });
    setShowContactForm(false);
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
          <p className="text-gray-600 mt-1">Find answers to common questions or contact the admin team</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                selectedCategory === category
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {filteredFaqs.map((faq, index) => (
              <div key={index}>
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                      {faq.category}
                    </span>
                    <span className="font-medium text-gray-900">{faq.question}</span>
                  </div>
                  <ChevronIcon
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedFaq === index ? "rotate-180" : ""
                    }`}
                    direction="down"
                  />
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 pl-[72px]">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Admin */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Can't find what you're looking for?</h2>
              <p className="text-sm text-gray-500">Contact the admin team for assistance</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600">Admin Online</span>
            </div>
          </div>

          {!showContactForm ? (
            <Button onClick={() => setShowContactForm(true)}>
              Contact Admin
            </Button>
          ) : (
            <form onSubmit={handleSubmitContact} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  placeholder="What do you need help with?"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Describe your issue or question..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                  required
                />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setShowContactForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Send Message
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <a href="/teacher/settings" className="p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all text-center">
            <div className="w-10 h-10 mx-auto mb-2 bg-primary-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="font-medium text-gray-900">Settings</p>
            <p className="text-xs text-gray-500">Manage your profile</p>
          </a>
          <a href="/teacher/classes" className="p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all text-center">
            <div className="w-10 h-10 mx-auto mb-2 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-medium text-gray-900">My Classes</p>
            <p className="text-xs text-gray-500">View your schedule</p>
          </a>
          <a href="/teacher/students" className="p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all text-center">
            <div className="w-10 h-10 mx-auto mb-2 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="font-medium text-gray-900">My Students</p>
            <p className="text-xs text-gray-500">View student list</p>
          </a>
        </div>
      </div>
    </div>
  );
}
