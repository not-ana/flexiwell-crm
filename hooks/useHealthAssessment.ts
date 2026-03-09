"use client";

import { useState, useCallback, useEffect } from "react";
import type {
  HealthAssessment,
  HealthAssessmentFormConfig,
  HealthAssessmentToken,
} from "@/lib/db/schemas";

// API response types
interface ApiResponse<T> {
  data?: T;
  error?: { error: string };
}

// Generic fetch helper
async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: { error: data.error || "Request failed" } };
    }

    return { data };
  } catch (error) {
    return { error: { error: "Network error" } };
  }
}

// ============================================
// Hook for client's own health assessment
// ============================================

export function useMyHealthAssessment() {
  const [assessment, setAssessment] = useState<HealthAssessment | null>(null);
  const [hasAssessment, setHasAssessment] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessment = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await apiFetch<{
      assessment: HealthAssessment | null;
      hasAssessment: boolean;
    }>("/api/health-assessments/my");

    if (response.error) {
      setError(response.error.error);
    } else if (response.data) {
      setAssessment(response.data.assessment);
      setHasAssessment(response.data.hasAssessment);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAssessment();
  }, [fetchAssessment]);

  const saveAssessment = async (
    data: Partial<HealthAssessment>,
    asDraft = false
  ) => {
    const payload = {
      ...data,
      status: asDraft ? "draft" : "submitted",
    };

    let response;

    if (assessment?._id) {
      // Update existing
      response = await apiFetch<{ assessment: HealthAssessment }>(
        `/api/health-assessments/${assessment._id}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );
    } else {
      // Create new
      response = await apiFetch<{ assessment: HealthAssessment }>(
        "/api/health-assessments",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
    }

    if (response.error) {
      return { success: false, error: response.error.error };
    }

    if (response.data?.assessment) {
      setAssessment(response.data.assessment);
      setHasAssessment(true);
    }

    return { success: true };
  };

  return {
    assessment,
    hasAssessment,
    isLoading,
    error,
    refetch: fetchAssessment,
    saveAssessment,
  };
}

// ============================================
// Hook for admin to view client's assessment
// ============================================

export function useClientHealthAssessment(clientId: string | null) {
  const [assessment, setAssessment] = useState<HealthAssessment | null>(null);
  const [history, setHistory] = useState<HealthAssessment[]>([]);
  const [hasAssessment, setHasAssessment] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessment = useCallback(async () => {
    if (!clientId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const response = await apiFetch<{
      assessment: HealthAssessment | null;
      hasAssessment: boolean;
      history: HealthAssessment[];
    }>(`/api/health-assessments/client/${clientId}?includeHistory=true`);

    if (response.error) {
      setError(response.error.error);
    } else if (response.data) {
      setAssessment(response.data.assessment);
      setHasAssessment(response.data.hasAssessment);
      setHistory(response.data.history || []);
    }

    setIsLoading(false);
  }, [clientId]);

  useEffect(() => {
    fetchAssessment();
  }, [fetchAssessment]);

  const requestUpdate = async (message?: string) => {
    if (!assessment?._id) {
      return { success: false, error: "No assessment found" };
    }

    const response = await apiFetch<{ success: boolean }>(
      `/api/health-assessments/${assessment._id}/request-update`,
      {
        method: "POST",
        body: JSON.stringify({ message }),
      }
    );

    if (response.error) {
      return { success: false, error: response.error.error };
    }

    await fetchAssessment();
    return { success: true };
  };

  const markAsReviewed = async (notes?: string) => {
    if (!assessment?._id) {
      return { success: false, error: "No assessment found" };
    }

    const response = await apiFetch<{ success: boolean }>(
      `/api/health-assessments/${assessment._id}/mark-reviewed`,
      {
        method: "POST",
        body: JSON.stringify({ notes }),
      }
    );

    if (response.error) {
      return { success: false, error: response.error.error };
    }

    await fetchAssessment();
    return { success: true };
  };

  return {
    assessment,
    history,
    hasAssessment,
    isLoading,
    error,
    refetch: fetchAssessment,
    requestUpdate,
    markAsReviewed,
  };
}

// ============================================
// Hook for form configuration
// ============================================

export function useHealthAssessmentConfig(establishmentId: string | null) {
  const [formConfig, setFormConfig] = useState<HealthAssessmentFormConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    if (!establishmentId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const response = await apiFetch<{ formConfig: HealthAssessmentFormConfig }>(
      `/api/health-assessments/config?establishmentId=${establishmentId}`
    );

    if (response.error) {
      setError(response.error.error);
    } else if (response.data) {
      setFormConfig(response.data.formConfig);
    }

    setIsLoading(false);
  }, [establishmentId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const saveConfig = async (config: Partial<HealthAssessmentFormConfig>) => {
    const response = await apiFetch<{ formConfig: HealthAssessmentFormConfig }>(
      "/api/health-assessments/config",
      {
        method: "PUT",
        body: JSON.stringify({
          establishmentId,
          ...config,
        }),
      }
    );

    if (response.error) {
      return { success: false, error: response.error.error };
    }

    if (response.data?.formConfig) {
      setFormConfig(response.data.formConfig);
    }

    return { success: true };
  };

  return {
    formConfig,
    isLoading,
    error,
    refetch: fetchConfig,
    saveConfig,
  };
}

// ============================================
// Hook for public form (token-based)
// ============================================

export function usePublicHealthAssessment(token: string | null) {
  const [isValid, setIsValid] = useState(false);
  const [clientEmail, setClientEmail] = useState<string | undefined>();
  const [clientName, setClientName] = useState<string | undefined>();
  const [establishmentId, setEstablishmentId] = useState<string | undefined>();
  const [formConfig, setFormConfig] = useState<Partial<HealthAssessmentFormConfig> | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [existingData, setExistingData] = useState<HealthAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const validateToken = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const response = await apiFetch<{
      valid: boolean;
      clientEmail?: string;
      clientName?: string;
      establishmentId: string;
      formConfig: Partial<HealthAssessmentFormConfig>;
      expiresAt: string;
      isEdit?: boolean;
      existingData?: HealthAssessment;
    }>(`/api/public/health-assessment/${token}`);

    if (response.error) {
      setError(response.error.error);
      setIsValid(false);
    } else if (response.data) {
      setIsValid(response.data.valid);
      setClientEmail(response.data.clientEmail);
      setClientName(response.data.clientName);
      setEstablishmentId(response.data.establishmentId);
      setFormConfig(response.data.formConfig);
      setExpiresAt(new Date(response.data.expiresAt));
      setIsEdit(response.data.isEdit || false);
      setExistingData(response.data.existingData || null);
    }

    setIsLoading(false);
  }, [token]);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  const submitAssessment = async (data: Partial<HealthAssessment>) => {
    if (!token) {
      return { success: false, error: "No token provided" };
    }

    const response = await apiFetch<{
      success: boolean;
      assessmentId: string;
      clientId: string;
    }>(`/api/public/health-assessment/${token}`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (response.error) {
      return { success: false, error: response.error.error };
    }

    return {
      success: true,
      assessmentId: response.data?.assessmentId,
      clientId: response.data?.clientId,
    };
  };

  return {
    isValid,
    clientEmail,
    clientName,
    establishmentId,
    formConfig,
    expiresAt,
    isEdit,
    existingData,
    isLoading,
    error,
    validateToken,
    submitAssessment,
  };
}

// ============================================
// Hook for token management (admin)
// ============================================

export function useHealthAssessmentTokens(establishmentId: string | null) {
  const [tokens, setTokens] = useState<(HealthAssessmentToken & { url: string })[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    if (!establishmentId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const response = await apiFetch<{
      tokens: (HealthAssessmentToken & { url: string })[];
      total: number;
    }>(`/api/health-assessments/tokens?establishmentId=${establishmentId}`);

    if (response.error) {
      setError(response.error.error);
    } else if (response.data) {
      setTokens(response.data.tokens);
      setTotal(response.data.total);
    }

    setIsLoading(false);
  }, [establishmentId]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const generateToken = async (data: {
    clientEmail?: string;
    clientName?: string;
    expiresInDays?: number;
  }) => {
    const response = await apiFetch<{
      success: boolean;
      token: string;
      url: string;
      expiresAt: string;
    }>("/api/health-assessments/token/generate", {
      method: "POST",
      body: JSON.stringify({
        establishmentId,
        ...data,
      }),
    });

    if (response.error) {
      return { success: false, error: response.error.error };
    }

    await fetchTokens();
    return {
      success: true,
      token: response.data?.token,
      url: response.data?.url,
      expiresAt: response.data?.expiresAt,
    };
  };

  const revokeToken = async (tokenId: string) => {
    const response = await apiFetch<{ success: boolean }>(
      `/api/health-assessments/token/${tokenId}`,
      { method: "DELETE" }
    );

    if (response.error) {
      return { success: false, error: response.error.error };
    }

    await fetchTokens();
    return { success: true };
  };

  return {
    tokens,
    total,
    isLoading,
    error,
    refetch: fetchTokens,
    generateToken,
    revokeToken,
  };
}
