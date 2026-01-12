"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
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
  type MakeupRequest,
} from "@/lib/api/client";
import { useApiData, useResourceById } from "./useResource";

// ============================================
// Helper for standard list + CRUD pattern
// ============================================

type ApiListResponse = { data?: unknown; error?: { error: string } };

function useListWithCrud<T, P>(
  listFn: (params?: P) => Promise<ApiListResponse>,
  createFn: ((data: Partial<T>) => Promise<ApiListResponse>) | undefined,
  updateFn: ((id: string, data: Partial<T>) => Promise<ApiListResponse>) | undefined,
  deleteFn: ((id: string) => Promise<ApiListResponse>) | undefined,
  params: P | undefined,
  config: { itemsKey: string; itemKey: string }
) {
  const { itemsKey, itemKey } = config;

  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paramsKey = JSON.stringify(params || {});

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await listFn(params);

    if (response.error) {
      setError(response.error.error);
    } else if (response.data) {
      const data = response.data as unknown as Record<string, unknown>;
      setItems((data[itemsKey] as T[]) || []);
      setTotal((data.total as number) || 0);
    }

    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const createItem = async (data: Partial<T>) => {
    if (!createFn) return { success: false, error: "Not supported" };
    const response = await createFn(data);
    if (response.data) {
      await fetchItems();
      const resData = response.data as unknown as Record<string, T>;
      return { success: true, [itemKey]: resData[itemKey] };
    }
    return { success: false, error: response.error?.error };
  };

  const updateItem = async (id: string, data: Partial<T>) => {
    if (!updateFn) return { success: false, error: "Not supported" };
    const response = await updateFn(id, data);
    if (response.data) {
      await fetchItems();
      const resData = response.data as unknown as Record<string, T>;
      return { success: true, [itemKey]: resData[itemKey] };
    }
    return { success: false, error: response.error?.error };
  };

  const deleteItem = async (id: string) => {
    if (!deleteFn) return { success: false, error: "Not supported" };
    const response = await deleteFn(id);
    if (!response.error) {
      await fetchItems();
      return { success: true };
    }
    return { success: false, error: response.error?.error };
  };

  return { items, total, isLoading, error, refetch: fetchItems, createItem, updateItem, deleteItem };
}

// ============================================
// Dashboard Stats Hook
// ============================================

export function useDashboardStats() {
  return useApiData<DashboardStats>(() => dashboardApi.getStats(), []);
}

// ============================================
// Clients Hooks
// ============================================

type ClientsParams = { page?: number; limit?: number; search?: string; status?: string };

export function useClients(params?: ClientsParams) {
  const result = useListWithCrud<Client, ClientsParams>(
    clientsApi.list,
    clientsApi.create,
    clientsApi.update,
    clientsApi.delete,
    params,
    { itemsKey: "clients", itemKey: "client" }
  );

  return {
    clients: result.items,
    total: result.total,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
    createClient: result.createItem,
    updateClient: result.updateItem,
    deleteClient: result.deleteItem,
  };
}

export function useClient(id: string | null) {
  const result = useResourceById<Client>(clientsApi.get, id, "client");
  return { client: result.data, isLoading: result.isLoading, error: result.error };
}

// ============================================
// Staff Hooks
// ============================================

type StaffParams = { role?: string; status?: string };

export function useStaff(params?: StaffParams) {
  const result = useListWithCrud<Staff, StaffParams>(
    staffApi.list,
    staffApi.create,
    staffApi.update,
    staffApi.delete,
    params,
    { itemsKey: "staff", itemKey: "staff" }
  );

  return {
    staff: result.items,
    total: result.total,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
    createStaff: result.createItem,
    updateStaff: result.updateItem,
    deleteStaff: result.deleteItem,
  };
}

// ============================================
// Classes Hooks
// ============================================

type ClassesParams = {
  instructorId?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
};

export function useClasses(params?: ClassesParams) {
  const result = useListWithCrud<Class, ClassesParams>(
    classesApi.list,
    classesApi.create,
    classesApi.update,
    classesApi.delete,
    params,
    { itemsKey: "classes", itemKey: "class" }
  );

  return {
    classes: result.items,
    total: result.total,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
    createClass: result.createItem,
    updateClass: result.updateItem,
    deleteClass: result.deleteItem,
  };
}

// ============================================
// Bookings Hooks
// ============================================

type BookingsParams = {
  clientId?: string;
  classId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
};

export function useBookings(params?: BookingsParams) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paramsKey = JSON.stringify(params || {});

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

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

  return { bookings, total, isLoading, error, refetch: fetchBookings, createBooking, cancelBooking };
}

// ============================================
// Payments Hooks
// ============================================

type PaymentsParams = {
  clientId?: string;
  status?: string;
  method?: string;
  startDate?: string;
  endDate?: string;
};

export function usePayments(params?: PaymentsParams) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paramsKey = JSON.stringify(params || {});

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

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
    return response.error ? { success: false, error: response.error.error } : { success: true };
  };

  const sendBulkReminders = async (ids: string[]) => {
    const response = await paymentsApi.sendBulkReminders(ids);
    return response.error ? { success: false, error: response.error.error } : { success: true };
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

// ============================================
// Dashboard Chart Hooks
// ============================================

export function useRevenueChart(period: "week" | "month" | "year") {
  const { data, isLoading, error } = useApiData(
    () => dashboardApi.getRevenueChart(period),
    [period]
  );
  return { data: data?.data || [], isLoading, error };
}

export function useClassMetrics() {
  const { data, isLoading, error } = useApiData(() => dashboardApi.getClassMetrics(), []);
  return { data: data?.data || [], isLoading, error };
}

// ============================================
// Teacher-specific Hooks
// ============================================

export function useTeacherDashboard() {
  return useApiData<TeacherDashboardResponse>(() => teacherApi.getDashboard(), []);
}

type TeacherClassesParams = { startDate?: string; endDate?: string };

export function useTeacherClasses(params?: TeacherClassesParams) {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paramsKey = JSON.stringify(params || {});

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

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

  return { classes, isLoading, error, refetch: fetchClasses, startClass, saveAttendance, createClass, addWalkIn };
}

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
    return response.data ? { success: true } : { success: false, error: response.error?.error };
  };

  const allStudents = useMemo(
    () => units.flatMap((unit) => unit.students.map((s) => ({ ...s, unitId: unit.id, unitName: unit.name }))),
    [units]
  );

  return {
    units,
    allStudents,
    totalStudents: allStudents.length,
    activeStudents: allStudents.filter((s) => s.status === "active").length,
    isLoading,
    error,
    refetch: fetchStudents,
    sendMessage,
  };
}

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

  return {
    requests,
    pendingCount: requests.filter((r) => r.status === "pending").length,
    isLoading,
    error,
    refetch: fetchMakeups,
    scheduleMakeup,
  };
}
