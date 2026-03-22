// API Client utilities for frontend

import { buildQueryString } from "@/lib/utils/query";
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/lib/utils/constants";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface ApiError {
  error: string;
  status: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export function getStoredTokens() {
  if (typeof window === "undefined") return { accessToken: null, refreshToken: null };

  return {
    accessToken: localStorage.getItem(TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  };
}

export function storeTokens(accessToken: string, refreshToken: string) {
  if (typeof window === "undefined") return;

  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// Refresh access token
async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = getStoredTokens();

  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const data = await response.json();
    storeTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

// Main API request function
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const { accessToken } = getStoredTokens();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (accessToken) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${accessToken}`;
  }

  try {
    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // If unauthorized, try to refresh token
    if (response.status === 401 && accessToken) {
      const newToken = await refreshAccessToken();

      if (newToken) {
        (headers as Record<string, string>)["Authorization"] = `Bearer ${newToken}`;
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
      }
    }

    const data = await response.json();

    if (!response.ok) {
      return {
        error: {
          error: data.error || "An error occurred",
          status: response.status,
        },
      };
    }

    return { data };
  } catch (error) {
    return {
      error: {
        error: error instanceof Error ? error.message : "Network error",
        status: 0,
      },
    };
  }
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: "GET" }),

  post: <T>(endpoint: string, body: unknown) =>
    apiRequest<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body: unknown) =>
    apiRequest<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  patch: <T>(endpoint: string, body: unknown) =>
    apiRequest<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: "DELETE" }),
};

// Auth API
export interface LoginRequest {
  email: string;
  password: string;
  turnstileToken?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: "admin" | "teacher" | "client";
  phone?: string;
  inviteCode?: string; // Codigo de convite para vincular cliente a empresa
  turnstileToken?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "teacher" | "client";
  phone?: string;
  avatar?: string;
  staffId?: string;
  clientId?: string;
  // Subscription and plan info
  planTier?: "retention_pro" | "scale";
  subscriptionStatus?: "none" | "trialing" | "active" | "past_due" | "canceled";
  trialStatus?: "active" | "expired" | "converted";
  trialEndDate?: string;
}

export interface AuthResponse {
  success: boolean;
  user: AuthUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export const authApi = {
  login: (credentials: LoginRequest) =>
    api.post<AuthResponse>("/api/auth/login", credentials),

  register: (data: RegisterRequest) =>
    api.post<AuthResponse>("/api/auth/register", data),

  me: () => api.get<{ user: AuthUser }>("/api/auth/me"),

  logout: () => api.post("/api/auth/logout", {}),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.put("/api/auth/password", { currentPassword, newPassword }),
};

// Clients API
export type ClientLifecycleStage = "lead" | "trial" | "active" | "at_risk" | "churned" | "won_back";

export interface ClientPlan {
  type: "monthly" | "quarterly" | "annual" | "drop-in" | "trial" | "challenge" | "premium" | "vip";
  totalClasses: number;
  usedClasses: number;
  remainingClasses: number;
  startDate: Date;
  endDate: Date;
  price: number; // Final price (after discount)
  originalPrice?: number; // List/catalog price before discount
  discountType?: "percentage" | "fixed" | "custom";
  discountValue?: number; // % or fixed amount
  discountReason?: string; // e.g. "early bird", "family", "partner"
}

export interface ClientHealthScore {
  overall: number;
  breakdown: {
    attendance: number;
    planUtilization: number;
    recency: number;
    paymentHealth: number;
  };
  lastCalculatedAt: Date;
}

export interface ClientMilestone {
  type: string;
  achievedAt: Date;
  acknowledged: boolean;
}

export interface Client {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  whatsappId?: string;
  instagramId?: string;
  avatar?: string;
  plan?: ClientPlan | string;
  status: "active" | "inactive" | "pending" | "paused" | "expired";
  // Hormozi lifecycle
  lifecycleStage?: ClientLifecycleStage;
  healthScore?: ClientHealthScore;
  currentStreak?: number;
  longestStreak?: number;
  lastClassDate?: string;
  totalLifetimeRevenue?: number;
  milestones?: ClientMilestone[];
  churnRiskScore?: number;
  onboarding?: {
    currentPhase?: "welcome" | "health_assessment" | "first_booking" | "pre_class" | "post_class" | "week_one" | "goal_review" | "completed";
    welcomeEmailSent: boolean;
    healthAssessmentCompleted: boolean;
    // Intake pipeline tracking
    intakeStatus?: "not_sent" | "sent" | "opened" | "completed";
    intakeSentAt?: Date;
    intakeSentVia?: "email" | "sms" | "whatsapp";
    intakeOpenedAt?: Date;
    intakeCompletedAt?: Date;
    intakeReminderCount?: number;
    intakeLastReminderAt?: Date;
    firstClassBooked: boolean;
    firstClassCompleted: boolean;
    firstClassFeedbackRating?: number;
    weekOneCheckInSent: boolean;
    weekOneClassCount?: number;
    weekTwoGoalReviewSent: boolean;
    onboardingCompletedAt?: Date;
    // Staff alerts
    staffAlertActive?: boolean;
    staffAlertType?: "health_form_stuck" | "no_booking" | "low_rating" | "disengaged";
    staffAlertCreatedAt?: Date;
  };
  preferences?: {
    preferredInstructors?: string[];
    preferredTimeSlots?: string[];
    notifications: {
      email: boolean;
      sms: boolean;
      whatsapp: boolean;
    };
  };
  // Display fields
  unit?: string;
  instructor?: string;
  classesRemaining?: number;
  classesTotal?: number;
  lastActivity?: string;
  revenue?: number;
  joinedDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientsResponse {
  clients: Client[];
  total: number;
  page: number;
  limit: number;
}

// LTV & Churn metrics (Hormozi)
export interface ClientMetrics {
  avgLTV: number;
  avgLifespanMonths: number;
  monthlyChurnRate: number;
  previousMonthlyChurnRate: number;
  revenuePerClientPerMonth: number;
  atRiskCount: number;
  churnedThisMonth: number;
  upgradeConversionRate: number;
}

export const clientsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; status?: string; lifecycleStage?: string }) =>
    api.get<ClientsResponse>(`/api/clients${buildQueryString(params || {})}`),

  get: (id: string) => api.get<{ client: Client }>(`/api/clients/${id}`),

  create: (data: Partial<Client>) => api.post<{ client: Client }>("/api/clients", data),

  update: (id: string, data: Partial<Client>) =>
    api.put<{ client: Client }>(`/api/clients/${id}`, data),

  delete: (id: string) => api.delete(`/api/clients/${id}`),

  getMetrics: () => api.get<ClientMetrics>("/api/admin/clients/metrics"),

  triggerOnboarding: (id: string, step: string) =>
    api.post<{ success: boolean }>(`/api/clients/${id}/onboarding`, { step }),

  sendWinBack: (ids: string[]) =>
    api.post<{ success: boolean }>("/api/clients/win-back", { clientIds: ids }),
};

// Staff API
export interface Staff {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "teacher";
  avatar?: string;
  specialties?: string[];
  schedule?: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  status: "active" | "inactive" | "invited";
  // Display fields
  unit?: string;
  classesThisWeek?: number;
  lastActive?: string;
  joinDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StaffResponse {
  staff: Staff[];
  total: number;
}

export const staffApi = {
  list: (params?: { role?: string; status?: string }) =>
    api.get<StaffResponse>(`/api/staff${buildQueryString(params || {})}`),

  get: (id: string) => api.get<{ staff: Staff }>(`/api/staff/${id}`),

  create: (data: Partial<Staff>) => api.post<{ staff: Staff }>("/api/staff", data),

  update: (id: string, data: Partial<Staff>) =>
    api.put<{ staff: Staff }>(`/api/staff/${id}`, data),

  delete: (id: string) => api.delete(`/api/staff/${id}`),
};

// Classes API
export interface Class {
  _id: string;
  title: string;
  description?: string;
  type: "yoga" | "pilates" | "stretching" | "meditation" | "other";
  instructor: {
    id: string;
    name: string;
  };
  schedule: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    recurring: boolean;
  };
  duration: number;
  capacity: number;
  enrolled: number;
  waitlist: number;
  room?: string;
  status: "scheduled" | "cancelled" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassesResponse {
  classes: Class[];
  total: number;
}

export const classesApi = {
  list: (params?: {
    instructorId?: string;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get<ClassesResponse>(`/api/classes${buildQueryString(params || {})}`),

  get: (id: string) => api.get<{ class: Class }>(`/api/classes/${id}`),

  create: (data: Partial<Class>) => api.post<{ class: Class }>("/api/classes", data),

  update: (id: string, data: Partial<Class>) =>
    api.put<{ class: Class }>(`/api/classes/${id}`, data),

  delete: (id: string) => api.delete(`/api/classes/${id}`),
};

// Bookings API
export interface Booking {
  _id: string;
  client: {
    id: string;
    name: string;
    email: string;
  };
  class: {
    id: string;
    title: string;
  };
  instructor: {
    id: string;
    name: string;
  };
  scheduledDate: Date;
  scheduledTime: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no-show";
  source: "web" | "bot" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingsResponse {
  bookings: Booking[];
  total: number;
}

export const bookingsApi = {
  list: (params?: {
    clientId?: string;
    classId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get<BookingsResponse>(`/api/bookings${buildQueryString(params || {})}`),

  get: (id: string) => api.get<{ booking: Booking }>(`/api/bookings/${id}`),

  create: (data: { clientId: string; classId: string; scheduledDate: string }) =>
    api.post<{ booking: Booking }>("/api/bookings", data),

  cancel: (id: string, reason?: string) =>
    api.put<{ booking: Booking }>(`/api/bookings/${id}/cancel`, { reason }),
};

// Payments API
export interface Payment {
  _id: string;
  client: {
    id: string;
    name: string;
    email: string;
  };
  amount: number;
  currency: string;
  type: "subscription" | "drop-in" | "package";
  plan?: {
    name: string;
    period: string;
  };
  status: "pending" | "completed" | "failed" | "refunded";
  method: "credit_card" | "pix" | "bank_transfer" | "cash";
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentsResponse {
  payments: Payment[];
  total: number;
  totalAmount?: number;
}

export const paymentsApi = {
  list: (params?: {
    clientId?: string;
    status?: string;
    method?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get<PaymentsResponse>(`/api/payments${buildQueryString(params || {})}`),

  get: (id: string) => api.get<{ payment: Payment }>(`/api/payments/${id}`),

  create: (data: Partial<Payment>) =>
    api.post<{ payment: Payment }>("/api/payments", data),

  sendReminder: (id: string) =>
    api.post(`/api/payments/${id}/reminder`, {}),

  sendBulkReminders: (ids: string[]) =>
    api.post("/api/payments/bulk-reminder", { paymentIds: ids }),
};

// Dashboard Stats API
export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  totalClasses: number;
  upcomingClasses: number;
  totalRevenue: number;
  monthlyRevenue: number;
  attendanceRate: number;
  newClientsThisMonth: number;
}

export const dashboardApi = {
  getStats: () => api.get<DashboardStats>("/api/dashboard/stats"),

  getRevenueChart: (period: "week" | "month" | "year") =>
    api.get<{ data: { date: string; amount: number }[] }>(`/api/dashboard/revenue?period=${period}`),

  getClassMetrics: () =>
    api.get<{ data: { type: string; count: number; attendance: number }[] }>("/api/dashboard/class-metrics"),
};

// Teacher-specific APIs
export interface TeacherStats {
  classesCompleted: number;
  totalClasses: number;
  studentsServed: number;
  avgAttendance: number;
  hoursTeaching: number;
  makeupPending: number;
}

export interface TeacherClass {
  id: string;
  title: string;
  type: string;
  start: string;
  end: string;
  color: "purple" | "green" | "blue" | "orange" | "pink";
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  room: string;
  unit: string;
  capacity: number;
  enrolled: number;
  students: {
    id: string;
    name: string;
    initials: string;
    attended?: boolean;
  }[];
}

export interface TeacherStudent {
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
}

export interface TeacherUnit {
  id: string;
  name: string;
  address: string;
  students: TeacherStudent[];
}

export interface MakeupRequest {
  id: string;
  studentName: string;
  studentInitials: string;
  originalClass: string;
  originalDate: string;
  requestedDate?: string;
  status: "pending" | "scheduled" | "completed";
}

export interface TodayScheduleItem {
  id: string;
  name: string;
  time: string;
  status: "completed" | "in-progress" | "upcoming" | "canceled";
  students: number;
  room: string;
}

export interface UpcomingClassItem {
  id: string;
  name: string;
  time: string;
  duration: string;
  students: number;
  maxStudents: number;
  room: string;
}

export interface WeeklyClassData {
  day: string;
  classes: number;
  students: number;
}

export interface ClassTypeData {
  name: string;
  value: number;
  color: string;
}

export interface TeacherDashboardResponse {
  stats: TeacherStats;
  todaySchedule: TodayScheduleItem[];
  upcomingClasses: UpcomingClassItem[];
  makeupRequests: MakeupRequest[];
  weeklyClassData: WeeklyClassData[];
  classTypeData: ClassTypeData[];
  studentAttendance: {
    id: string;
    name: string;
    initials: string;
    classesAttended: number;
    totalClasses: number;
    lastClass: string;
    needsMakeup: boolean;
  }[];
}

export const teacherApi = {
  getDashboard: () =>
    api.get<TeacherDashboardResponse>("/api/teacher/dashboard"),

  getStats: () =>
    api.get<{ stats: TeacherStats }>("/api/teacher/stats"),

  getClasses: (params?: { startDate?: string; endDate?: string }) =>
    api.get<{ classes: TeacherClass[] }>(`/api/teacher/classes${buildQueryString(params || {})}`),

  getClass: (id: string) =>
    api.get<{ class: TeacherClass }>(`/api/teacher/classes/${id}`),

  startClass: (id: string) =>
    api.post<{ class: TeacherClass }>(`/api/teacher/classes/${id}/start`, {}),

  saveAttendance: (classId: string, attendance: Record<string, boolean>) =>
    api.post<{ success: boolean }>(`/api/teacher/classes/${classId}/attendance`, { attendance }),

  getStudents: () =>
    api.get<{ units: TeacherUnit[] }>("/api/teacher/students"),

  getStudent: (id: string) =>
    api.get<{ student: TeacherStudent }>(`/api/teacher/students/${id}`),

  sendMessage: (studentId: string, message: string, channel: "whatsapp" | "email" | "sms") =>
    api.post<{ success: boolean }>(`/api/teacher/students/${studentId}/message`, { message, channel }),

  getMakeupRequests: () =>
    api.get<{ requests: MakeupRequest[] }>("/api/teacher/makeups"),

  scheduleMakeup: (requestId: string, date: string) =>
    api.post<{ request: MakeupRequest }>(`/api/teacher/makeups/${requestId}/schedule`, { date }),

  createClass: (data: Partial<TeacherClass>) =>
    api.post<{ class: TeacherClass }>("/api/teacher/classes", data),

  addWalkIn: (classId: string, student: { name: string; email?: string; phone?: string }) =>
    api.post<{ success: boolean }>(`/api/teacher/classes/${classId}/walkin`, student),
};
