"use client";

import { useState } from "react";
import { UserIcon, ClockIcon } from "@/components/icons";
import Button from "@/components/ui/Button";

export default function TeacherSettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "schedule">("profile");

  // Profile state
  const [profile, setProfile] = useState({
    name: "Maria Santos",
    email: "maria@flexiwell.com",
    phone: "+55 11 98765-4321",
    bio: "Certified Pilates instructor with 8 years of experience. Specialized in rehabilitation and posture correction.",
    specialties: ["Pilates", "Yoga", "Stretching"],
  });

  // Schedule state
  const [schedule, setSchedule] = useState([
    { day: "monday", enabled: true, slots: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "18:00" }] },
    { day: "tuesday", enabled: true, slots: [{ start: "10:00", end: "12:00" }, { start: "15:00", end: "19:00" }] },
    { day: "wednesday", enabled: true, slots: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "18:00" }] },
    { day: "thursday", enabled: true, slots: [{ start: "10:00", end: "12:00" }, { start: "16:00", end: "20:00" }] },
    { day: "friday", enabled: true, slots: [{ start: "09:00", end: "12:00" }] },
    { day: "saturday", enabled: false, slots: [] },
    { day: "sunday", enabled: false, slots: [] },
  ]);

  const dayNames: Record<string, string> = {
    monday: "Segunda-feira",
    tuesday: "Terça-feira",
    wednesday: "Quarta-feira",
    thursday: "Quinta-feira",
    friday: "Sexta-feira",
    saturday: "Sábado",
    sunday: "Domingo",
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your profile and availability</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit mb-8">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "profile" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <UserIcon className="w-4 h-4" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "schedule" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <ClockIcon className="w-4 h-4" />
            Availability
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h2>

            {/* Avatar */}
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-700">MS</span>
              </div>
              <div>
                <Button variant="secondary">Change Photo</Button>
                <p className="text-sm text-gray-500 mt-2">JPG, GIF or PNG. Max size 2MB.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialties</label>
                <div className="flex flex-wrap gap-2">
                  {profile.specialties.map((specialty) => (
                    <span key={specialty} className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                      {specialty}
                    </span>
                  ))}
                  <button className="px-3 py-1.5 border border-dashed border-gray-300 text-gray-500 rounded-full text-sm hover:border-gray-400">
                    + Add
                  </button>
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button>Save Changes</Button>
            </div>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === "schedule" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Your Availability</h2>
                <p className="text-sm text-gray-500">Set your working hours for each day</p>
              </div>
            </div>

            <div className="space-y-4">
              {schedule.map((day, dayIndex) => (
                <div key={day.day} className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0">
                  <div className="w-36">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={day.enabled}
                        onChange={(e) => {
                          const newSchedule = [...schedule];
                          newSchedule[dayIndex].enabled = e.target.checked;
                          setSchedule(newSchedule);
                        }}
                        className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className={`font-medium ${day.enabled ? "text-gray-900" : "text-gray-400"}`}>
                        {dayNames[day.day]}
                      </span>
                    </label>
                  </div>

                  {day.enabled ? (
                    <div className="flex-1 space-y-2">
                      {day.slots.map((slot, slotIndex) => (
                        <div key={slotIndex} className="flex items-center gap-2">
                          <input
                            type="time"
                            value={slot.start}
                            onChange={(e) => {
                              const newSchedule = [...schedule];
                              newSchedule[dayIndex].slots[slotIndex].start = e.target.value;
                              setSchedule(newSchedule);
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                          />
                          <span className="text-gray-400">to</span>
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(e) => {
                              const newSchedule = [...schedule];
                              newSchedule[dayIndex].slots[slotIndex].end = e.target.value;
                              setSchedule(newSchedule);
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                          />
                          {day.slots.length > 1 && (
                            <button
                              onClick={() => {
                                const newSchedule = [...schedule];
                                newSchedule[dayIndex].slots.splice(slotIndex, 1);
                                setSchedule(newSchedule);
                              }}
                              className="p-2 text-gray-400 hover:text-red-500"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newSchedule = [...schedule];
                          newSchedule[dayIndex].slots.push({ start: "09:00", end: "17:00" });
                          setSchedule(newSchedule);
                        }}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        + Add time slot
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Unavailable</span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <Button>Save Availability</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
