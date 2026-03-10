"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { SearchIcon, FilterIcon, ChevronIcon } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { authFetch } from "@/lib/api/auth-fetch";

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  initials: string;
  avatar?: string;
  plan: string;
  classesRemaining: number;
  classesTotal: number;
  nextClass?: string;
  status: "active" | "paused" | "expired";
  joinedDate: string;
  lastActive?: string;
  // Attendance tracking fields
  currentStreak?: number;
  healthScore?: number;
  daysSinceLastClass?: number;
  lifecycleStage?: "trial" | "active" | "at_risk" | "churned";
  // Health assessment data (synced from intake form)
  healthAssessmentId?: string;
  medicalFlags?: {
    hasHeartCondition?: boolean;
    hasHighBloodPressure?: boolean;
    hasAsthma?: boolean;
    hasArthritis?: boolean;
    hasOsteoporosis?: boolean;
    hasScoliosis?: boolean;
    hasHernias?: boolean;
    hasDiabetes?: boolean;
    isPregnant?: boolean;
    hasSurgeryHistory?: boolean;
    hasCurrentPain?: boolean;
    hasMedications?: boolean;
    hasAllergies?: boolean;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  goals?: string[];
  physicalRestrictions?: string[];
  dateOfBirth?: string;
  gender?: string;
}

interface Unit {
  id: string;
  name: string;
  address: string;
  students: Student[];
}

const statusStyles = {
  active: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", label: "Active" },
  paused: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500", label: "Paused" },
  expired: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: "Expired" },
};

function StatusBadge({ status }: { status: Student["status"] }) {
  const style = statusStyles[status];
  return <Badge style={style} />;
}

// Streak badge for attendance consistency
function StreakBadge({ streak }: { streak?: number }) {
  if (!streak || streak === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700" title={`${streak} week streak`}>
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      </svg>
      {streak}w
    </span>
  );
}

// Indicator for students who haven't attended recently
function InactiveIndicator({ daysSinceLastClass, healthScore }: { daysSinceLastClass?: number; healthScore?: number }) {
  const isAtRisk = (daysSinceLastClass && daysSinceLastClass > 10) || (healthScore !== undefined && healthScore < 40);
  if (!isAtRisk) return null;

  const severity = (daysSinceLastClass && daysSinceLastClass > 21) || (healthScore !== undefined && healthScore < 25)
    ? "critical" : "warning";

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
      severity === "critical" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
    }`} title={daysSinceLastClass ? `Last class ${daysSinceLastClass} days ago` : `Engagement score: ${healthScore}`}>
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      {daysSinceLastClass ? `${daysSinceLastClass}d` : "Low"}
    </span>
  );
}

function StudentRow({ student, onViewProfile, onSendMessage }: {
  student: Student;
  onViewProfile: (student: Student) => void;
  onSendMessage: (student: Student) => void;
}) {
  const progressPercent = student.classesTotal > 0 ? (student.classesRemaining / student.classesTotal) * 100 : 0;
  const isAtRisk = (student.daysSinceLastClass && student.daysSinceLastClass > 10) || (student.healthScore !== undefined && student.healthScore < 40);

  return (
    <tr className={`hover:bg-gray-50 transition-colors ${isAtRisk ? "bg-orange-50/30" : ""}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-primary-700">{student.initials}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900">{student.name}</p>
              <StreakBadge streak={student.currentStreak} />
              <InactiveIndicator daysSinceLastClass={student.daysSinceLastClass} healthScore={student.healthScore} />
            </div>
            <p className="text-sm text-gray-500">{student.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={student.status} />
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-900">{student.plan}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${progressPercent > 50 ? "bg-green-500" : progressPercent > 20 ? "bg-yellow-500" : "bg-red-500"}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{student.classesRemaining}/{student.classesTotal}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-900">{student.phone}</p>
      </td>
      <td className="px-4 py-3">
        {student.nextClass ? (
          <p className="text-sm text-primary-600 font-medium">{student.nextClass}</p>
        ) : (
          <p className="text-sm text-gray-400">—</p>
        )}
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-500">{student.lastActive || "—"}</p>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button onClick={() => onViewProfile(student)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="View profile">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
          </button>
          <button onClick={() => onSendMessage(student)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Send message">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

function StudentCard({ student, onViewProfile, onSendMessage }: {
  student: Student;
  onViewProfile: (student: Student) => void;
  onSendMessage: (student: Student) => void;
}) {
  const progressPercent = student.classesTotal > 0 ? (student.classesRemaining / student.classesTotal) * 100 : 0;
  const isAtRisk = (student.daysSinceLastClass && student.daysSinceLastClass > 10) || (student.healthScore !== undefined && student.healthScore < 40);

  return (
    <div className={`p-4 border-b border-gray-100 last:border-b-0 ${isAtRisk ? "bg-orange-50/30" : ""}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-primary-700">{student.initials}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-gray-900">{student.name}</p>
              <StreakBadge streak={student.currentStreak} />
              <InactiveIndicator daysSinceLastClass={student.daysSinceLastClass} healthScore={student.healthScore} />
            </div>
            <p className="text-xs text-gray-500">{student.email}</p>
          </div>
        </div>
        <StatusBadge status={student.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div>
          <p className="text-gray-500 text-xs">Plan</p>
          <p className="font-medium text-gray-900 truncate">{student.plan}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${progressPercent > 50 ? "bg-green-500" : progressPercent > 20 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-xs text-gray-500">{student.classesRemaining}/{student.classesTotal}</span>
          </div>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Phone</p>
          <p className="font-medium text-gray-900">{student.phone}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Next Class</p>
          {student.nextClass ? <p className="font-medium text-primary-600">{student.nextClass}</p> : <p className="text-gray-400">—</p>}
        </div>
        <div>
          <p className="text-gray-500 text-xs">Last Active</p>
          <p className="font-medium text-gray-900">{student.lastActive || "—"}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1">
        <button onClick={() => onViewProfile(student)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="View profile">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
        </button>
        <button onClick={() => onSendMessage(student)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Send message">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
        </button>
      </div>
    </div>
  );
}

function UnitSection({ unit, isExpanded, onToggle, onViewProfile, onSendMessage }: {
  unit: Unit; isExpanded: boolean; onToggle: () => void;
  onViewProfile: (student: Student) => void; onSendMessage: (student: Student) => void;
}) {
  const activeCount = unit.students.filter((s) => s.status === "active").length;
  const atRiskCount = unit.students.filter((s) => (s.daysSinceLastClass && s.daysSinceLastClass > 10) || (s.healthScore !== undefined && s.healthScore < 40)).length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4 hover:bg-gray-50 transition-colors">
        <div className="flex-1 text-left min-w-0">
          <h2 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{unit.name}</h2>
          <p className="text-xs sm:text-sm text-gray-500 truncate">{unit.address}</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
          <div className="text-right">
            <p className="text-xs sm:text-sm font-medium text-gray-900">{unit.students.length} students</p>
            <div className="flex items-center gap-2 justify-end">
              <p className="text-xs text-gray-500">{activeCount} active</p>
              {atRiskCount > 0 && (
                <span className="text-xs font-semibold text-orange-600">{atRiskCount} inactive</span>
              )}
            </div>
          </div>
          <ChevronIcon className="w-5 h-5 text-gray-400 transition-transform flex-shrink-0" direction={isExpanded ? "up" : "down"} />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100 lg:hidden">
          {unit.students.map((student) => (
            <StudentCard key={student.id} student={student} onViewProfile={onViewProfile} onSendMessage={onSendMessage} />
          ))}
        </div>
      )}

      {isExpanded && (
        <div className="border-t border-gray-100 hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Class</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {unit.students.map((student) => (
                <StudentRow key={student.id} student={student} onViewProfile={onViewProfile} onSendMessage={onSendMessage} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Student Profile Modal
function StudentProfileModal({ student, isOpen, onClose }: { student: Student | null; isOpen: boolean; onClose: () => void }) {
  if (!isOpen || !student) return null;

  const isAtRisk = (student.daysSinceLastClass && student.daysSinceLastClass > 10) || (student.healthScore !== undefined && student.healthScore < 40);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
              <span className="text-xl font-semibold text-primary-700">{student.initials}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-gray-900">{student.name}</h2>
                <StreakBadge streak={student.currentStreak} />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={student.status} />
                <InactiveIndicator daysSinceLastClass={student.daysSinceLastClass} healthScore={student.healthScore} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* At-risk warning */}
          {isAtRisk && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-orange-900">Haven't seen them in a while</p>
                  <p className="text-xs text-orange-700">
                    {student.daysSinceLastClass ? `Last class was ${student.daysSinceLastClass} days ago.` : ""}
                    {" "}A quick check-in could help.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{student.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">{student.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Plan</p>
              <p className="font-medium text-gray-900">{student.plan}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Classes Remaining</p>
              <p className="font-medium text-gray-900">{student.classesRemaining} of {student.classesTotal}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="font-medium text-gray-900">{student.joinedDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Week Streak</p>
              <p className="font-medium text-gray-900">{student.currentStreak || 0} weeks</p>
            </div>
          </div>

          {student.nextClass && (
            <div>
              <p className="text-sm text-gray-500">Next Class</p>
              <p className="font-medium text-primary-600">{student.nextClass}</p>
            </div>
          )}

          {/* Health Assessment Data */}
          {student.healthAssessmentId && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Health Info</p>

              {/* Medical flags as badges */}
              {student.medicalFlags && (() => {
                const flagLabels: Record<string, string> = {
                  hasHeartCondition: "Heart Condition",
                  hasHighBloodPressure: "High Blood Pressure",
                  hasAsthma: "Asthma",
                  hasArthritis: "Arthritis",
                  hasOsteoporosis: "Osteoporosis",
                  hasScoliosis: "Scoliosis",
                  hasHernias: "Herniated Disc",
                  hasDiabetes: "Diabetes",
                  isPregnant: "Pregnant",
                  hasSurgeryHistory: "Surgery History",
                  hasCurrentPain: "Current Pain",
                  hasMedications: "On Medication",
                  hasAllergies: "Allergies",
                };
                const activeFlags = Object.entries(student.medicalFlags)
                  .filter(([, value]) => value)
                  .map(([key]) => flagLabels[key] || key);

                if (activeFlags.length === 0) return (
                  <p className="text-xs text-green-600">No medical conditions reported</p>
                );

                return (
                  <div className="flex flex-wrap gap-1.5">
                    {activeFlags.map((flag) => (
                      <span key={flag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        {flag}
                      </span>
                    ))}
                  </div>
                );
              })()}

              {/* Physical restrictions */}
              {student.physicalRestrictions && student.physicalRestrictions.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Restrictions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {student.physicalRestrictions.map((r) => (
                      <span key={r} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                        {r.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Goals */}
              {student.goals && student.goals.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Goals</p>
                  <div className="flex flex-wrap gap-1.5">
                    {student.goals.map((g) => (
                      <span key={g} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {g.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Emergency contact */}
              {student.emergencyContact && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Emergency Contact</p>
                  <p className="text-sm font-medium text-gray-900">{student.emergencyContact.name}</p>
                  <p className="text-xs text-gray-600">{student.emergencyContact.phone} ({student.emergencyContact.relationship})</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <button onClick={onClose} className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

// Send Message Modal with quick message templates
function SendMessageModal({ student, isOpen, onClose }: { student: Student | null; isOpen: boolean; onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState<"whatsapp" | "email" | "sms">("sms");

  if (!isOpen || !student) return null;

  const isAtRisk = (student.daysSinceLastClass && student.daysSinceLastClass > 10);

  const handleSend = () => {
    if (!message.trim()) { alert("Please enter a message"); return; }
    console.log("Sending message:", { to: student.name, message, channel });
    alert(`Message sent to ${student.name} via ${channel.toUpperCase()}!`);
    setMessage(""); onClose();
  };

  const quickMessages = isAtRisk
    ? [
        `Hey ${student.name.split(" ")[0]}! We miss you in class. Your spot is always reserved.`,
        `Hi ${student.name.split(" ")[0]}, noticed you haven't been in a while. Everything ok? Would love to help you get back on track.`,
        `${student.name.split(" ")[0]}, you still have ${student.classesRemaining} classes left on your plan. Let's make sure you use them!`,
      ]
    : [
        "See you in class!",
        "Don't forget your water bottle",
        "Class is confirmed for tomorrow",
        `Great job on your ${student.currentStreak || 0}-week streak!`,
      ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Send Message</h2>
          <p className="text-sm text-gray-600 mt-1">Send a message to {student.name}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
            <div className="flex gap-2">
              {(["sms", "email"] as const).map((ch) => (
                <button key={ch} onClick={() => setChannel(ch)}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${channel === ch ? "bg-primary-100 text-primary-700 border-2 border-primary-500" : "bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100"}`}>
                  {ch === "email" ? "Email" : "SMS"}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500">To: {student.name}</p>
            <p className="text-sm text-gray-700 font-medium">{channel === "email" ? student.email : student.phone}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message here..." rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">{isAtRisk ? "Suggested messages:" : "Quick messages:"}</p>
            <div className="flex flex-col gap-2">
              {quickMessages.map((quick) => (
                <button key={quick} onClick={() => setMessage(quick)}
                  className="px-3 py-2 text-xs text-left bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  {quick}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSend} className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">Send Message</button>
        </div>
      </div>
    </div>
  );
}

// Inactive Students Alert Banner
function InactiveAlertBanner({ students, onSendMessage }: { students: Student[]; onSendMessage: (student: Student) => void }) {
  const atRiskStudents = students.filter(s =>
    (s.daysSinceLastClass && s.daysSinceLastClass > 10) || (s.healthScore !== undefined && s.healthScore < 40)
  );

  if (atRiskStudents.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4 mb-4 sm:mb-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-orange-900">{atRiskStudents.length} student{atRiskStudents.length !== 1 ? "s" : ""} haven't attended recently</p>
          <p className="text-sm text-orange-700">A quick check-in can make all the difference</p>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {atRiskStudents.slice(0, 5).map((student) => (
          <button key={student.id} onClick={() => onSendMessage(student)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-orange-200 rounded-lg hover:border-orange-400 transition-colors flex-shrink-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
              <span className="text-[10px] font-semibold text-primary-700">{student.initials}</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">{student.name.split(" ")[0]}</p>
              <p className="text-xs text-orange-600">{student.daysSinceLastClass ? `${student.daysSinceLastClass}d ago` : "Inactive"}</p>
            </div>
            <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TeacherStudentsPage() {
  const searchParams = useSearchParams();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "inactive" | Student["status"]>(
    searchParams.get("filter") === "inactive" ? "inactive" : "all"
  );
  const [expandedUnits, setExpandedUnits] = useState<string[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addStudentError, setAddStudentError] = useState("");

  const handleAddStudent = async (data: { name: string; email: string; phone: string; plan: string; _sendIntake?: boolean; _intakeChannel?: string }) => {
    setAddLoading(true);
    setAddStudentError("");
    try {
      if (data._sendIntake) {
        const response = await authFetch("/api/clients/send-intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            phone: data.phone,
            plan: data.plan,
            channel: data._intakeChannel || "email",
          }),
        });
        if (response.ok) {
          setShowAddModal(false);
          fetchStudents();
        } else {
          const result = await response.json();
          setAddStudentError(result.error || "Failed to add student");
        }
      } else {
        const response = await authFetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: data.name, email: data.email, phone: data.phone, plan: data.plan, status: "active" }),
        });
        if (response.ok) {
          setShowAddModal(false);
          fetchStudents();
        } else {
          setAddStudentError("Failed to add student");
        }
      }
    } catch (error) {
      console.error("Failed to add student:", error);
      setAddStudentError("Failed to add student");
    } finally {
      setAddLoading(false);
    }
  };

  const fetchStudents = useCallback(async () => {
    try {
      const response = await authFetch("/api/teacher/students");
      if (response.ok) {
        const data = await response.json();
        setUnits(data.units);
        setExpandedUnits(data.units.map((u: Unit) => u.id));
      }
    } catch (error) { console.error("Failed to fetch students:", error); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleViewProfile = (student: Student) => { setSelectedStudent(student); setShowProfileModal(true); };
  const handleSendMessage = (student: Student) => { setSelectedStudent(student); setShowMessageModal(true); };
  const toggleUnit = (unitId: string) => {
    setExpandedUnits((prev) => prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]);
  };

  const filteredUnits = units.map((unit) => ({
    ...unit,
    students: unit.students.filter((student) => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || student.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all"
        || (statusFilter === "inactive" ? (student.daysSinceLastClass != null && student.daysSinceLastClass > 7) : student.status === statusFilter);
      return matchesSearch && matchesStatus;
    }),
  })).filter((unit) => unit.students.length > 0);

  const allStudents = units.flatMap(u => u.students);
  const totalStudents = allStudents.length;
  const activeStudents = allStudents.filter(s => s.status === "active").length;
  const atRiskStudents = allStudents.filter(s => s.daysSinceLastClass != null && s.daysSinceLastClass > 7).length;

  if (loading) {
    return <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Students</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your students across all locations</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 text-sm bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4" /></svg>
          Add
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Total Students</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{totalStudents}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Active Students</p>
          <p className="text-lg sm:text-2xl font-bold text-green-600 mt-1">{activeStudents}</p>
        </div>
        <button
          onClick={() => setStatusFilter(statusFilter === "inactive" ? "all" : "inactive")}
          className={`bg-white border rounded-xl p-3 sm:p-4 text-left transition-colors ${statusFilter === "inactive" ? "border-orange-400 ring-2 ring-orange-200" : "border-orange-200 hover:border-orange-300"}`}
        >
          <p className="text-xs sm:text-sm text-orange-600">Inactive</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-lg sm:text-2xl font-bold text-orange-600">{atRiskStudents}</p>
            {atRiskStudents > 0 && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">{statusFilter === "inactive" ? "Showing" : "Follow up"}</span>}
          </div>
        </button>
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Locations</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{units.length}</p>
        </div>
      </div>

      {/* At-Risk Alert Banner - only show when not already filtering inactive */}
      {statusFilter !== "inactive" && (
        <InactiveAlertBanner students={allStudents} onSendMessage={handleSendMessage} />
      )}

      {/* Active filter indicator */}
      {statusFilter === "inactive" && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
          <svg className="w-4 h-4 text-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm font-medium text-orange-800 flex-1">
            Showing {filteredUnits.reduce((sum, u) => sum + u.students.length, 0)} inactive students — haven't attended in 10+ days
          </p>
          <button
            onClick={() => setStatusFilter("all")}
            className="text-xs font-medium text-orange-600 hover:text-orange-800 px-2 py-1 rounded hover:bg-orange-100 transition-colors"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6 bg-white rounded-xl p-3 sm:p-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search student by name or email..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 sm:bg-transparent border border-gray-200 sm:border-0 rounded-lg sm:rounded-none focus:outline-none focus:ring-2 sm:focus:ring-0 focus:ring-primary-500 text-gray-900 placeholder-gray-500" />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 flex-1 sm:flex-none min-w-0">
            <FilterIcon className="w-5 h-5 text-gray-400 hidden lg:block flex-shrink-0" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="paused">Paused</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <button onClick={() => setExpandedUnits(expandedUnits.length === units.length ? [] : units.map((u) => u.id))}
            className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
            <span className="hidden lg:inline">{expandedUnits.length === units.length ? "Collapse all" : "Expand all"}</span>
            <span className="lg:hidden">{expandedUnits.length === units.length ? "Collapse" : "Expand"}</span>
          </button>
        </div>
      </div>

      {/* Units List */}
      <div className="space-y-4">
        {filteredUnits.length > 0 ? (
          filteredUnits.map((unit) => (
            <UnitSection key={unit.id} unit={unit} isExpanded={expandedUnits.includes(unit.id)} onToggle={() => toggleUnit(unit.id)}
              onViewProfile={handleViewProfile} onSendMessage={handleSendMessage} />
          ))
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No students found</h3>
            <p className="text-gray-500">Try adjusting your search filters</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <StudentProfileModal student={selectedStudent} isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <SendMessageModal student={selectedStudent} isOpen={showMessageModal} onClose={() => setShowMessageModal(false)} />
      <AddStudentModal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setAddStudentError(""); }} onSubmit={handleAddStudent} isSubmitting={addLoading} apiError={addStudentError} />
    </div>
  );
}

// ============================================
// Add Student Modal
// ============================================
const addStudentPlans = [
  { id: "starter", name: "Starter", price: 49, classes: 8 },
  { id: "growth", name: "Growth", price: 79, classes: 16 },
  { id: "professional", name: "Professional", price: 149, classes: -1 },
];

function AddStudentModal({
  isOpen, onClose, onSubmit, isSubmitting, apiError,
}: {
  isOpen: boolean; onClose: () => void;
  onSubmit: (data: { name: string; email: string; phone: string; plan: string; _sendIntake?: boolean; _intakeChannel?: string }) => Promise<void>;
  isSubmitting: boolean;
  apiError?: string;
}) {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", plan: "starter" });
  const [sendIntakeForm, setSendIntakeForm] = useState(true);
  const [intakeChannel, setIntakeChannel] = useState<"whatsapp" | "email" | "sms">("email");
  const [formError, setFormError] = useState("");

  const handleSubmit = async () => {
    setFormError("");
    if (!formData.name || !formData.email) {
      setFormError("Please fill in name and email");
      return;
    }
    if (sendIntakeForm && intakeChannel === "sms" && !formData.phone) {
      setFormError("Phone number is required for SMS");
      return;
    }
    const selectedPlan = addStudentPlans.find((p) => p.id === formData.plan) || addStudentPlans[0];
    await onSubmit({
      ...formData,
      plan: selectedPlan.name,
      _sendIntake: sendIntakeForm,
      _intakeChannel: intakeChannel,
    });
  };

  if (!isOpen) return null;

  const channelOptions = [
    { value: "whatsapp" as const, label: "WhatsApp", icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
    { value: "email" as const, label: "Email", icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
    { value: "sms" as const, label: "SMS", icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Add Student</h2>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {(formError || apiError) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">{formError || apiError}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input type="text" value={formData.name} onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setFormError(""); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              placeholder="Full name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                placeholder="email@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone {sendIntakeForm && intakeChannel !== "email" ? "*" : ""}
              </label>
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                placeholder="(555) 123-4567" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan *</label>
            <select value={formData.plan} onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm">
              {addStudentPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - ${plan.price}/mo ({plan.classes === -1 ? "Unlimited" : `${plan.classes} classes`})
                </option>
              ))}
            </select>
          </div>

          {/* Intake Form Section */}
          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendIntakeForm}
                onChange={(e) => setSendIntakeForm(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Send intake form</span>
                <p className="text-xs text-gray-500">Student receives a health assessment link</p>
              </div>
            </label>

            {sendIntakeForm && (
              <div className="mt-3 ml-7">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Send via</label>
                <div className="flex gap-2">
                  {channelOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setIntakeChannel(option.value)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
                        intakeChannel === option.value
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {option.icon} {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={isSubmitting}
            className="px-4 py-2 text-sm bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {sendIntakeForm ? "Add & Send Form" : "Add Student"}
          </button>
        </div>
      </div>
    </div>
  );
}
