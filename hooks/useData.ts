"use client";

import { useState, useEffect, useCallback } from "react";
import {
  clientsApi,
  staffApi,
  classesApi,
  bookingsApi,
  paymentsApi,
  dashboardApi,
  teacherApi,
  type Client,
  type Staff,
  type Class,
  type Booking,
  type Payment,
  type DashboardStats,
  type TeacherDashboardResponse,
  type TeacherClass,
  type TeacherUnit,
  type TeacherStudent,
  type MakeupRequest,
} from "@/lib/api/client";

// Generic hook for data fetching with loading and error states
function useApiData<T>(
  fetchFn: () => Promise<{ data?: T; error?: { error: string; status: number } }>,
  dependencies: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await fetchFn();

    if (response.error) {
      setError(response.error.error);
      setData(null);
    } else if (response.data) {
      setData(response.data);
    }

    setIsLoading(false);
  }, [fetchFn]);

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { data, isLoading, error, refetch };
}

// Dashboard Stats Hook
export function useDashboardStats() {
  return useApiData<DashboardStats>(
    () => dashboardApi.getStats(),
    []
  );
}

// Clients Hooks
export function useClients(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await clientsApi.list(params);

    if (response.error) {
      setError(response.error.error);
    } else if (response.data) {
      setClients(response.data.clients);
      setTotal(response.data.total);
    }

    setIsLoading(false);
  }, [params]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const createClient = async (data: Partial<Client>) => {
    const response = await clientsApi.create(data);
    if (response.data) {
      await fetchClients();
      return { success: true, client: response.data.client };
    }
    return { success: false, error: response.error?.error };
  };

  const updateClient = async (id: string, data: Partial<Client>) => {
    const response = await clientsApi.update(id, data);
    if (response.data) {
      await fetchClients();
      return { success: true, client: response.data.client };
    }
    return { success: false, error: response.error?.error };
  };

  const deleteClient = async (id: string) => {
    const response = await clientsApi.delete(id);
    if (!response.error) {
      await fetchClients();
      return { success: true };
    }
    return { success: false, error: response.error?.error };
  };

  return {
    clients,
    total,
    isLoading,
    error,
    refetch: fetchClients,
    createClient,
    updateClient,
    deleteClient,
  };
}

// Single Client Hook
export function useClient(id: string | null) {
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setClient(null);
      return;
    }

    const fetchClient = async () => {
      setIsLoading(true);
      setError(null);

      const response = await clientsApi.get(id);

      if (response.error) {
        setError(response.error.error);
      } else if (response.data) {
        setClient(response.data.client);
      }

      setIsLoading(false);
    };

    fetchClient();
  }, [id]);

  return { client, isLoading, error };
}

// Staff Hooks
export function useStaff(params?: { role?: string; status?: string }) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await staffApi.list(params);

    if (response.error) {
      setError(response.error.error);
    } else if (response.data) {
      setStaff(response.data.staff);
      setTotal(response.data.total);
    }

    setIsLoading(false);
  }, [params]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const createStaff = async (data: Partial<Staff>) => {
    const response = await staffApi.create(data);
    if (response.data) {
      await fetchStaff();
      return { success: true, staff: response.data.staff };
    }
    return { success: false, error: response.error?.error };
  };

  const updateStaff = async (id: string, data: Partial<Staff>) => {
    const response = await staffApi.update(id, data);
    if (response.data) {
      await fetchStaff();
      return { success: true, staff: response.data.staff };
    }
    return { success: false, error: response.error?.error };
  };

  const deleteStaff = async (id: string) => {
    const response = await staffApi.delete(id);
    if (!response.error) {
      await fetchStaff();
      return { success: true };
    }
    return { success: false, error: response.error?.error };
  };

  return {
    staff,
    total,
    isLoading,
    error,
    refetch: fetchStaff,
    createStaff,
    updateStaff,
    deleteStaff,
  };
}

// Classes Hooks
export function useClasses(params?: {
  instructorId?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await classesApi.list(params);

    if (response.error) {
      setError(response.error.error);
    } else if (response.data) {
      setClasses(response.data.classes);
      setTotal(response.data.total);
    }

    setIsLoading(false);
  }, [params]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const createClass = async (data: Partial<Class>) => {
    const response = await classesApi.create(data);
    if (response.data) {
      await fetchClasses();
      return { success: true, class: response.data.class };
    }
    return { success: false, error: response.error?.error };
  };

  const updateClass = async (id: string, data: Partial<Class>) => {
    const response = await classesApi.update(id, data);
    if (response.data) {
      await fetchClasses();
      return { success: true, class: response.data.class };
    }
    return { success: false, error: response.error?.error };
  };

  const deleteClass = async (id: string) => {
    const response = await classesApi.delete(id);
    if (!response.error) {
      await fetchClasses();
      return { success: true };
    }
    return { success: false, error: response.error?.error };
  };

  return {
    classes,
    total,
    isLoading,
    error,
    refetch: fetchClasses,
    createClass,
    updateClass,
    deleteClass,
  };
}

// Bookings Hooks
export function useBookings(params?: {
  clientId?: string;
  classId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await bookingsApi.list(params);

    if (response.error) {
      setError(response.error.error);
    } else if (response.data) {
      setBookings(response.data.bookings);
      setTotal(response.data.total);
    }

    setIsLoading(false);
  }, [params]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const createBooking = async (data: {
    clientId: string;
    classId: string;
    scheduledDate: string;
  }) => {
    const response = await bookingsApi.create(data);
    if (response.data) {
      await fetchBookings();
      return { success: true, booking: response.data.booking };
    }
    return { success: false, error: response.error?.error };
  };

  const cancelBooking = async (id: string, reason?: string) => {
    const response = await bookingsApi.cancel(id, reason);
    if (response.data) {
      await fetchBookings();
      return { success: true, booking: response.data.booking };
    }
    return { success: false, error: response.error?.error };
  };

  return {
    bookings,
    total,
    isLoading,
    error,
    refetch: fetchBookings,
    createBooking,
    cancelBooking,
  };
}

// Payments Hooks
export function usePayments(params?: {
  clientId?: string;
  status?: string;
  method?: string;
  startDate?: string;
  endDate?: string;
}) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await paymentsApi.list(params);

    if (response.error) {
      setError(response.error.error);
    } else if (response.data) {
      setPayments(response.data.payments);
      setTotal(response.data.total);
      setTotalAmount(response.data.totalAmount || 0);
    }

    setIsLoading(false);
  }, [params]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const createPayment = async (data: Partial<Payment>) => {
    const response = await paymentsApi.create(data);
    if (response.data) {
      await fetchPayments();
      return { success: true, payment: response.data.payment };
    }
    return { success: false, error: response.error?.error };
  };

  const sendReminder = async (id: string) => {
    const response = await paymentsApi.sendReminder(id);
    if (!response.error) {
      return { success: true };
    }
    return { success: false, error: response.error?.error };
  };

  const sendBulkReminders = async (ids: string[]) => {
    const response = await paymentsApi.sendBulkReminders(ids);
    if (!response.error) {
      return { success: true };
    }
    return { success: false, error: response.error?.error };
  };

  return {
    payments,
    total,
    totalAmount,
    isLoading,
    error,
    refetch: fetchPayments,
    createPayment,
    sendReminder,
    sendBulkReminders,
  };
}

// Revenue Chart Hook
export function useRevenueChart(period: "week" | "month" | "year") {
  const [data, setData] = useState<{ date: string; amount: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      const response = await dashboardApi.getRevenueChart(period);

      if (response.error) {
        setError(response.error.error);
      } else if (response.data) {
        setData(response.data.data);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [period]);

  return { data, isLoading, error };
}

// Class Metrics Hook
export function useClassMetrics() {
  const [data, setData] = useState<
    { type: string; count: number; attendance: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      const response = await dashboardApi.getClassMetrics();

      if (response.error) {
        setError(response.error.error);
      } else if (response.data) {
        setData(response.data.data);
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

  return { data, isLoading, error };
}

// ===========================================
// Teacher-specific Hooks
// ===========================================

// Teacher Dashboard Hook
export function useTeacherDashboard() {
  const [data, setData] = useState<TeacherDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await teacherApi.getDashboard();

    if (response.error) {
      setError(response.error.error);
    } else if (response.data) {
      setData(response.data);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

// Teacher Classes Hook
export function useTeacherClasses(params?: { startDate?: string; endDate?: string }) {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await teacherApi.getClasses(params);

    if (response.error) {
      setError(response.error.error);
    } else if (response.data) {
      setClasses(response.data.classes);
    }

    setIsLoading(false);
  }, [params]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const startClass = async (id: string) => {
    const response = await teacherApi.startClass(id);
    if (response.data) {
      await fetchClasses();
      return { success: true, class: response.data.class };
    }
    return { success: false, error: response.error?.error };
  };

  const saveAttendance = async (classId: string, attendance: Record<string, boolean>) => {
    const response = await teacherApi.saveAttendance(classId, attendance);
    if (response.data) {
      await fetchClasses();
      return { success: true };
    }
    return { success: false, error: response.error?.error };
  };

  const createClass = async (data: Partial<TeacherClass>) => {
    const response = await teacherApi.createClass(data);
    if (response.data) {
      await fetchClasses();
      return { success: true, class: response.data.class };
    }
    return { success: false, error: response.error?.error };
  };

  const addWalkIn = async (classId: string, student: { name: string; email?: string; phone?: string }) => {
    const response = await teacherApi.addWalkIn(classId, student);
    if (response.data) {
      await fetchClasses();
      return { success: true };
    }
    return { success: false, error: response.error?.error };
  };

  return {
    classes,
    isLoading,
    error,
    refetch: fetchClasses,
    startClass,
    saveAttendance,
    createClass,
    addWalkIn,
  };
}

// Teacher Students Hook
export function useTeacherStudents() {
  const [units, setUnits] = useState<TeacherUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await teacherApi.getStudents();

    if (response.error) {
      setError(response.error.error);
    } else if (response.data) {
      setUnits(response.data.units);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const sendMessage = async (studentId: string, message: string, channel: "whatsapp" | "email" | "sms") => {
    const response = await teacherApi.sendMessage(studentId, message, channel);
    if (response.data) {
      return { success: true };
    }
    return { success: false, error: response.error?.error };
  };

  // Flatten all students
  const allStudents = units.flatMap(unit =>
    unit.students.map(s => ({ ...s, unitId: unit.id, unitName: unit.name }))
  );

  const totalStudents = allStudents.length;
  const activeStudents = allStudents.filter(s => s.status === "active").length;

  return {
    units,
    allStudents,
    totalStudents,
    activeStudents,
    isLoading,
    error,
    refetch: fetchStudents,
    sendMessage,
  };
}

// Teacher Makeup Requests Hook
export function useTeacherMakeups() {
  const [requests, setRequests] = useState<MakeupRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMakeups = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await teacherApi.getMakeupRequests();

    if (response.error) {
      setError(response.error.error);
    } else if (response.data) {
      setRequests(response.data.requests);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchMakeups();
  }, [fetchMakeups]);

  const scheduleMakeup = async (requestId: string, date: string) => {
    const response = await teacherApi.scheduleMakeup(requestId, date);
    if (response.data) {
      await fetchMakeups();
      return { success: true, request: response.data.request };
    }
    return { success: false, error: response.error?.error };
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;

  return {
    requests,
    pendingCount,
    isLoading,
    error,
    refetch: fetchMakeups,
    scheduleMakeup,
  };
}
