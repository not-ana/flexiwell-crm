"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchIcon, PlusIcon, ChevronIcon, ArrowLeftIcon, CloseIcon } from "@/components/icons";

interface ClassItem {
  id: string;
  title: string;
  type: string;
  instructorId: string;
  instructorName: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  maxCapacity: number;
  currentEnrollment: number;
  status: "scheduled" | "completed" | "cancelled";
  location?: string;
  establishmentId?: string;
}

interface EstablishmentOption {
  _id: string;
  name: string;
  location?: string;
  rooms?: string[];
}

interface CreateModalEstablishment {
  id: string;
  name: string;
}

const typeColors: Record<string, string> = {
  yoga: "bg-purple-100 text-purple-700",
  pilates: "bg-pink-100 text-pink-700",
  stretching: "bg-green-100 text-green-700",
  meditation: "bg-blue-100 text-blue-700",
  other: "bg-gray-100 text-gray-700",
};

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function isToday(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isTomorrow(dateStr: string) {
  const date = new Date(dateStr);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
}

interface StaffMember {
  id: string;
  name: string;
  establishmentIds?: string[];
}

// Create Class Modal
function CreateClassModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "Pilates",
    date: "",
    time: "",
    duration: "50",
    establishmentId: "",
    unit: "",
    capacity: "8",
    instructorId: "",
    instructorName: "",
    recurrence: "none" as "none" | "daily" | "weekly" | "biweekly" | "monthly",
    recurrenceEndDate: "",
    recurrenceDays: [] as string[],
  });
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewCount, setPreviewCount] = useState(0);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdClass, setCreatedClass] = useState<typeof formData & { classesCreated?: number } | null>(null);
  const [establishments, setEstablishments] = useState<CreateModalEstablishment[]>([]);
  const [loadingEstablishments, setLoadingEstablishments] = useState(true);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchEstablishments = async () => {
      setLoadingEstablishments(true);
      try {
        const response = await fetch("/api/establishments?active=true");
        const data = await response.json();
        const estabs = (data.establishments || []).map((e: { _id?: { toString(): string }; name: string }) => ({
          id: e._id?.toString() || "",
          name: e.name,
        }));
        setEstablishments(estabs);
        if (estabs.length > 0 && !formData.establishmentId) {
          setFormData(prev => ({
            ...prev,
            establishmentId: estabs[0].id,
            unit: estabs[0].name,
          }));
        }
      } catch (error) {
        console.error("Error fetching establishments:", error);
      } finally {
        setLoadingEstablishments(false);
      }
    };

    const fetchStaff = async () => {
      setLoadingStaff(true);
      try {
        const response = await fetch("/api/staff?role=teacher&status=active");
        const data = await response.json();
        const staffList = (data.staff || []).map((s: { _id?: { toString(): string }; name: string; establishmentIds?: string[] }) => ({
          id: s._id?.toString() || "",
          name: s.name,
          establishmentIds: s.establishmentIds || [],
        }));
        setStaff(staffList);
      } catch (error) {
        console.error("Error fetching staff:", error);
      } finally {
        setLoadingStaff(false);
      }
    };

    fetchEstablishments();
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);


  // Filter staff by selected establishment
  const filteredStaff = formData.establishmentId
    ? staff.filter(s => !s.establishmentIds?.length || s.establishmentIds.includes(formData.establishmentId))
    : staff;

  if (!isOpen) return null;

  // Calculate how many classes will be created
  const calculateDates = useCallback(() => {
    if (formData.recurrence === "none") return [formData.date].filter(Boolean);
    if (!formData.date || !formData.recurrenceEndDate) return [];

    const dates: string[] = [];
    const startDate = new Date(formData.date);
    const endDate = new Date(formData.recurrenceEndDate);
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      if (formData.recurrence === "daily") {
        dates.push(currentDate.toISOString().split("T")[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (formData.recurrence === "weekly") {
        const dayOfWeek = currentDate.getDay().toString();
        if (formData.recurrenceDays.includes(dayOfWeek)) {
          dates.push(currentDate.toISOString().split("T")[0]);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (formData.recurrence === "biweekly") {
        dates.push(currentDate.toISOString().split("T")[0]);
        currentDate.setDate(currentDate.getDate() + 14);
      } else if (formData.recurrence === "monthly") {
        dates.push(currentDate.toISOString().split("T")[0]);
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
    return dates;
  }, [formData.date, formData.recurrence, formData.recurrenceEndDate, formData.recurrenceDays]);

  const handleSubmit = async () => {
    setFormError(null);

    if (!formData.name || !formData.date || !formData.time || !formData.instructorId) {
      return;
    }

    if (formData.recurrence !== "none" && !formData.recurrenceEndDate) {
      setFormError("Please select an end date for the recurring classes.");
      return;
    }
    if (formData.recurrence === "weekly" && formData.recurrenceDays.length === 0) {
      setFormError("Please select at least one day for weekly recurrence.");
      return;
    }

    const dates = calculateDates();

    // Show preview for batch creation
    if (dates.length > 1 && !showPreview) {
      setPreviewCount(dates.length);
      setShowPreview(true);
      return;
    }

    setIsCreating(true);
    setShowPreview(false);
    try {
      const [hours, minutes] = formData.time.split(":").map(Number);
      const durationMinutes = parseInt(formData.duration);
      const endHours = Math.floor((hours * 60 + minutes + durationMinutes) / 60);
      const endMinutes = (hours * 60 + minutes + durationMinutes) % 60;
      const endTime = `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;

      let successCount = 0;
      for (const date of dates) {
        const response = await fetch("/api/classes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.name,
            description: formData.description || undefined,
            type: formData.type.toLowerCase(),
            scheduledDate: date,
            startTime: formData.time,
            endTime: endTime,
            duration: parseInt(formData.duration),
            maxCapacity: parseInt(formData.capacity),
            establishmentId: formData.establishmentId,
            location: formData.unit,
            instructorId: formData.instructorId,
            instructorName: formData.instructorName,
          }),
        });

        if (response.ok) {
          successCount++;
        }
      }

      if (successCount > 0) {
        setCreatedClass({ ...formData, classesCreated: successCount });
        setShowSuccess(true);
      } else {
        setFormError("Failed to create class. Please check your data and try again.");
      }
    } catch (error) {
      console.error("Error creating class:", error);
      setFormError("Connection error. Please check your internet and try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setShowSuccess(false);
    setCreatedClass(null);
    const defaultEstab = establishments[0];
    const defaultStaff = staff[0];
    setFormData({
      name: "",
      description: "",
      type: "Pilates",
      date: "",
      time: "",
      duration: "50",
      establishmentId: defaultEstab?.id || "",
      unit: defaultEstab?.name || "",
      capacity: "8",
      instructorId: defaultStaff?.id || "",
      instructorName: defaultStaff?.name || "",
      recurrence: "none",
      recurrenceEndDate: "",
      recurrenceDays: [],
    });
    onClose();
  };

  const getRecurrenceLabel = (recurrence: string) => {
    const labels: Record<string, string> = {
      none: "One-time",
      daily: "Daily",
      weekly: "Weekly",
      biweekly: "Every 2 weeks",
      monthly: "Monthly",
    };
    return labels[recurrence] || recurrence;
  };

  if (showSuccess && createdClass) {
    const classCount = createdClass.classesCreated || 1;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {classCount > 1 ? `${classCount} Classes Created!` : "Class Created Successfully!"}
            </h2>
            <p className="text-gray-600 mb-6">
              {classCount > 1 ? `Your recurring classes have been scheduled.` : "Your new class has been scheduled."}
            </p>

            <div className="bg-gray-50 rounded-xl p-4 text-left mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">{createdClass.name}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>
                    {createdClass.recurrence !== "none"
                      ? `${createdClass.date} to ${createdClass.recurrenceEndDate}`
                      : createdClass.date}
                  </span>
                </div>
                {createdClass.recurrence !== "none" && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{getRecurrenceLabel(createdClass.recurrence)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{createdClass.time} ({createdClass.duration} min)</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{createdClass.unit}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{createdClass.capacity} students capacity</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create New Class</h2>
              <p className="text-sm text-gray-600 mt-1">Schedule a new class for your students</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Essential fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Intermediate Pilates"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              {loadingEstablishments ? (
                <div className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  Loading...
                </div>
              ) : establishments.length === 0 ? (
                <div className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  No locations available
                </div>
              ) : (
                <select
                  value={formData.establishmentId}
                  onChange={(e) => {
                    const estab = establishments.find((est) => est.id === e.target.value);
                    const newFilteredStaff = staff.filter(s => !s.establishmentIds?.length || s.establishmentIds.includes(e.target.value));
                    const firstInstructor = newFilteredStaff[0];
                    setFormData({
                      ...formData,
                      establishmentId: e.target.value,
                      unit: estab?.name || "",
                      instructorId: firstInstructor?.id || "",
                      instructorName: firstInstructor?.name || "",
                    });
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                >
                  {establishments.map((estab) => (
                    <option key={estab.id} value={estab.id}>
                      {estab.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructor <span className="text-red-500">*</span>
              </label>
              {loadingStaff ? (
                <div className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  Loading...
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  No instructors for this location
                </div>
              ) : (
                <select
                  value={formData.instructorId}
                  onChange={(e) => {
                    const selected = filteredStaff.find((s) => s.id === e.target.value);
                    setFormData({
                      ...formData,
                      instructorId: e.target.value,
                      instructorName: selected?.name || "",
                    });
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                >
                  {filteredStaff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Defaults summary line */}
          {!showMoreOptions && (
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm text-gray-500">
              <span>{formData.type} · {formData.duration}min · {formData.capacity} spots</span>
              <button
                type="button"
                onClick={() => setShowMoreOptions(true)}
                className="text-primary-600 hover:text-primary-700 font-medium shrink-0 ml-3"
              >
                Edit
              </button>
            </div>
          )}

          {/* More options (collapsed by default) */}
          {showMoreOptions && (
            <div className="space-y-4 border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">More options</span>
                <button
                  type="button"
                  onClick={() => setShowMoreOptions(false)}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  Collapse
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description visible to clients (optional)"
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                  >
                    <option value="Pilates">Pilates</option>
                    <option value="Yoga">Yoga</option>
                    <option value="Functional">Functional Training</option>
                    <option value="Stretching">Stretching</option>
                    <option value="Meditation">Meditation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                  >
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="50">50 min</option>
                    <option value="60">60 min</option>
                    <option value="75">75 min</option>
                    <option value="90">90 min</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
                <select
                  value={formData.recurrence}
                  onChange={(e) => setFormData({ ...formData, recurrence: e.target.value as typeof formData.recurrence })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                >
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every 2 weeks</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {formData.recurrence !== "none" && (
                <>
                  {formData.recurrence === "weekly" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Repeat on</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: "0", label: "Sun" },
                          { value: "1", label: "Mon" },
                          { value: "2", label: "Tue" },
                          { value: "3", label: "Wed" },
                          { value: "4", label: "Thu" },
                          { value: "5", label: "Fri" },
                          { value: "6", label: "Sat" },
                        ].map((day) => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => {
                              const days = formData.recurrenceDays.includes(day.value)
                                ? formData.recurrenceDays.filter((d) => d !== day.value)
                                : [...formData.recurrenceDays, day.value];
                              setFormData({ ...formData, recurrenceDays: days });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              formData.recurrenceDays.includes(day.value)
                                ? "bg-primary-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.recurrenceEndDate}
                      onChange={(e) => setFormData({ ...formData, recurrenceEndDate: e.target.value })}
                      min={formData.date}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Inline Error */}
        {formError && (
          <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <p className="text-sm text-red-600">{formError}</p>
            <button onClick={() => setFormError(null)} className="text-red-400 hover:text-red-600 p-1 shrink-0">
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Batch Preview Confirmation */}
        {showPreview && (
          <div className="mx-6 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-medium text-amber-800 mb-2">
              This will create {previewCount} classes
            </p>
            <p className="text-xs text-amber-700 mb-3">
              From {formData.date} to {formData.recurrenceEndDate}, {getRecurrenceLabel(formData.recurrence).toLowerCase()}.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Confirm & Create
              </button>
            </div>
          </div>
        )}

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isCreating || !formData.name || !formData.date || !formData.time || !formData.instructorId}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating...
              </>
            ) : (
              "Create Class"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("upcoming");

  // Establishment filter state
  const [establishments, setEstablishments] = useState<EstablishmentOption[]>([]);
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<string>("all");
  const [hasMultipleEstablishments, setHasMultipleEstablishments] = useState(false);

  // Create class modal state
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchEstablishments = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/establishments", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.establishments) {
          setEstablishments(data.establishments);
          setHasMultipleEstablishments(data.hasMultiple || data.establishments.length > 1);
        }
      }
    } catch (error) {
      console.error("Failed to fetch establishments:", error);
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const response = await fetch("/api/classes");
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEstablishments();
    fetchClasses();
  }, [fetchEstablishments, fetchClasses]);

  // Filter classes
  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      // Establishment filter
      if (selectedEstablishmentId !== "all" && cls.establishmentId !== selectedEstablishmentId) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !cls.title.toLowerCase().includes(query) &&
          !cls.instructorName.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== "all" && cls.type !== typeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && cls.status !== statusFilter) {
        return false;
      }

      // Date filter
      const classDate = new Date(cls.scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateFilter === "today") {
        return isToday(cls.scheduledDate);
      } else if (dateFilter === "upcoming") {
        return classDate >= today;
      } else if (dateFilter === "past") {
        return classDate < today;
      }

      return true;
    });
  }, [classes, searchQuery, typeFilter, statusFilter, dateFilter, selectedEstablishmentId]);

  // Group classes by date
  const groupedClasses = useMemo(() => {
    const groups: Record<string, ClassItem[]> = {};

    filteredClasses.forEach((cls) => {
      const dateKey = new Date(cls.scheduledDate).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(cls);
    });

    // Sort by time within each group
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return groups;
  }, [filteredClasses]);

  // Sort date keys
  const sortedDates = Object.keys(groupedClasses).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  // Stats
  const todayClasses = classes.filter((c) => isToday(c.scheduledDate) && c.status === "scheduled").length;
  const upcomingClasses = classes.filter((c) => {
    const date = new Date(c.scheduledDate);
    return date >= new Date() && c.status === "scheduled";
  }).length;
  const totalEnrolled = filteredClasses.reduce((sum, c) => sum + c.currentEnrollment, 0);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Class Schedule</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and view all classes</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Add Class
          </button>
        </div>

        {/* Establishment Selector */}
        {hasMultipleEstablishments && establishments.length > 1 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Studio
            </label>
            <select
              value={selectedEstablishmentId}
              onChange={(e) => setSelectedEstablishmentId(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            >
              <option value="all">All Studios</option>
              {establishments.map((est) => (
                <option key={est._id} value={est._id}>
                  {est.name} {est.location ? `- ${est.location}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-600">Today&apos;s Classes</p>
            <p className="text-2xl font-bold text-primary-600 mt-1">{todayClasses}</p>
            <p className="text-xs text-gray-400 mt-1">scheduled for today</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-600">Upcoming</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{upcomingClasses}</p>
            <p className="text-xs text-gray-400 mt-1">classes ahead</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-600">Total Enrolled</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{totalEnrolled}</p>
            <p className="text-xs text-gray-400 mt-1">
              {filteredClasses.length > 0
                ? `avg ${Math.round(totalEnrolled / filteredClasses.length)} per class`
                : "across all classes"}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-600">Total Classes</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{classes.length}</p>
            <p className="text-xs text-gray-400 mt-1">all time</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search classes or instructors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Types</option>
              <option value="yoga">Yoga</option>
              <option value="pilates">Pilates</option>
              <option value="stretching">Stretching</option>
              <option value="meditation">Meditation</option>
              <option value="other">Other</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Classes List */}
        {filteredClasses.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {classes.length === 0 ? "No classes yet" : "No matching classes"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {classes.length === 0
                ? "Classes are where your revenue happens. Create your first class to start filling spots."
                : "Try adjusting your filters to find classes."}
            </p>
            {classes.length === 0 && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700"
              >
                <PlusIcon className="w-4 h-4" />
                Create First Class
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((dateKey) => {
              const dateClasses = groupedClasses[dateKey];
              const displayDate = isToday(dateKey)
                ? "Today"
                : isTomorrow(dateKey)
                ? "Tomorrow"
                : formatDate(dateKey);

              return (
                <div key={dateKey}>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {displayDate}
                  </h2>
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {dateClasses.map((cls, index) => (
                      <div
                        key={cls.id}
                        className={`p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors ${
                          index !== dateClasses.length - 1 ? "border-b border-gray-100" : ""
                        }`}
                      >
                        {/* Time */}
                        <div className="w-20 text-center">
                          <p className="text-sm font-semibold text-gray-900">{cls.startTime}</p>
                          <p className="text-xs text-gray-500">{cls.endTime}</p>
                        </div>

                        {/* Class Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900">{cls.title}</h3>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${typeColors[cls.type] || typeColors.other}`}>
                              {cls.type.charAt(0).toUpperCase() + cls.type.slice(1)}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[cls.status]}`}>
                              {cls.status.charAt(0).toUpperCase() + cls.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {cls.instructorName} • {cls.duration} min
                            {cls.location && ` • ${cls.location}`}
                          </p>
                        </div>

                        {/* Enrollment */}
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {cls.currentEnrollment}/{cls.maxCapacity}
                          </p>
                          <div
                            className="w-20 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden"
                            role="progressbar"
                            aria-valuenow={cls.currentEnrollment}
                            aria-valuemin={0}
                            aria-valuemax={cls.maxCapacity}
                            aria-label={`${cls.currentEnrollment} of ${cls.maxCapacity} spots filled`}
                          >
                            <div
                              className={`h-full rounded-full ${
                                cls.currentEnrollment >= cls.maxCapacity
                                  ? "bg-red-500"
                                  : cls.currentEnrollment >= cls.maxCapacity * 0.8
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{ width: `${(cls.currentEnrollment / cls.maxCapacity) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {cls.maxCapacity - cls.currentEnrollment > 0
                              ? `${cls.maxCapacity - cls.currentEnrollment} left`
                              : "full"}
                          </p>
                        </div>

                        {/* Actions */}
                        <Link
                          href={`/admin/classes/${cls.id}`}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        >
                          <ChevronIcon className="w-5 h-5" direction="right" />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Class Modal */}
      <CreateClassModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          fetchClasses();
        }}
      />
    </div>
  );
}
