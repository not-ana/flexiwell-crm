"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { showToast } from "./shared";

interface Teacher {
  id: string;
  name: string;
  email: string;
  initials: string;
}

interface Establishment {
  id: string;
  name: string;
  location: string;
  assignedTeachers: string[];
}

export function EstablishmentsSettings() {
  const [establishments, setEstablishments] = useState<Establishment[]>([
    { id: "1", name: "FlexiWell Downtown", location: "Downtown, New York", assignedTeachers: ["1", "2"] },
    { id: "2", name: "FlexiWell Midtown", location: "Midtown, New York", assignedTeachers: ["1", "3"] },
    { id: "3", name: "FlexiWell Uptown", location: "Uptown, New York", assignedTeachers: ["2"] },
  ]);

  const allTeachers: Teacher[] = [
    { id: "1", name: "Sarah Johnson", email: "sarah@flexiwell.com", initials: "SJ" },
    { id: "2", name: "Michael Chen", email: "michael@flexiwell.com", initials: "MC" },
    { id: "3", name: "Emily Davis", email: "emily@flexiwell.com", initials: "ED" },
    { id: "4", name: "James Wilson", email: "james@flexiwell.com", initials: "JW" },
  ];

  const [editingEstablishment, setEditingEstablishment] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEstablishment, setNewEstablishment] = useState({ name: "", location: "" });

  const toggleTeacherAssignment = (establishmentId: string, teacherId: string) => {
    setEstablishments(prev => prev.map(est => {
      if (est.id !== establishmentId) return est;
      const isAssigned = est.assignedTeachers.includes(teacherId);
      return {
        ...est,
        assignedTeachers: isAssigned
          ? est.assignedTeachers.filter(id => id !== teacherId)
          : [...est.assignedTeachers, teacherId]
      };
    }));
  };

  const getTeacherById = (id: string) => allTeachers.find(t => t.id === id);

  const handleAddEstablishment = () => {
    if (!newEstablishment.name || !newEstablishment.location) return;
    const newId = String(establishments.length + 1);
    setEstablishments([...establishments, { id: newId, ...newEstablishment, assignedTeachers: [] }]);
    setNewEstablishment({ name: "", location: "" });
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Establishments</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your locations and assign teachers to each establishment.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>Add Establishment</Button>
      </div>

      {/* Establishments List */}
      <div className="space-y-4">
        {establishments.map((establishment) => (
          <div key={establishment.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Establishment Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{establishment.name}</h3>
                  <p className="text-sm text-gray-500">{establishment.location}</p>
                </div>
                <button
                  onClick={() => setEditingEstablishment(editingEstablishment === establishment.id ? null : establishment.id)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {editingEstablishment === establishment.id ? "Done" : "Manage Teachers"}
                </button>
              </div>

              {/* Assigned Teachers Preview */}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-gray-500">Teachers:</span>
                <div className="flex -space-x-2">
                  {establishment.assignedTeachers.slice(0, 4).map((teacherId) => {
                    const teacher = getTeacherById(teacherId);
                    if (!teacher) return null;
                    return (
                      <div
                        key={teacherId}
                        className="w-7 h-7 rounded-full bg-green-100 border-2 border-white flex items-center justify-center"
                        title={teacher.name}
                      >
                        <span className="text-xs font-medium text-green-700">{teacher.initials}</span>
                      </div>
                    );
                  })}
                  {establishment.assignedTeachers.length > 4 && (
                    <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">+{establishment.assignedTeachers.length - 4}</span>
                    </div>
                  )}
                </div>
                {establishment.assignedTeachers.length === 0 && (
                  <span className="text-xs text-gray-400 italic">No teachers assigned</span>
                )}
              </div>
            </div>

            {/* Teacher Assignment Panel */}
            {editingEstablishment === establishment.id && (
              <div className="p-6 bg-gray-50">
                <p className="text-sm font-medium text-gray-700 mb-3">Select teachers for this establishment:</p>
                <div className="grid grid-cols-2 gap-3">
                  {allTeachers.map((teacher) => {
                    const isAssigned = establishment.assignedTeachers.includes(teacher.id);
                    return (
                      <button
                        key={teacher.id}
                        onClick={() => toggleTeacherAssignment(establishment.id, teacher.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                          isAssigned
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isAssigned ? "bg-green-100" : "bg-gray-100"
                        }`}>
                          <span className={`text-sm font-medium ${isAssigned ? "text-green-700" : "text-gray-600"}`}>
                            {teacher.initials}
                          </span>
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`text-sm font-medium ${isAssigned ? "text-green-700" : "text-gray-900"}`}>
                            {teacher.name}
                          </p>
                          <p className="text-xs text-gray-500">{teacher.email}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isAssigned ? "border-green-500 bg-green-500" : "border-gray-300"
                        }`}>
                          {isAssigned && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Establishment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Add Establishment</h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="e.g., FlexiWell Downtown"
                  value={newEstablishment.name}
                  onChange={(e) => setNewEstablishment({ ...newEstablishment, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g., Downtown, São Paulo"
                  value={newEstablishment.location}
                  onChange={(e) => setNewEstablishment({ ...newEstablishment, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEstablishment}
                disabled={!newEstablishment.name || !newEstablishment.location}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                Add Establishment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
