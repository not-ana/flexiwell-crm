"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

// ============================================================================
// Types
// ============================================================================

interface UseFormStateOptions<T> {
  initialData: T;
  onSave?: (data: T) => Promise<void>;
  validate?: (data: T) => Record<string, string> | null;
}

interface UseFormStateReturn<T> {
  data: T;
  originalData: T;
  hasUnsavedChanges: boolean;
  errors: Record<string, string>;
  isValid: boolean;

  // Actions
  setData: (data: T | ((prev: T) => T)) => void;
  setField: <K extends keyof T>(field: K, value: T[K]) => void;
  reset: () => void;
  resetToOriginal: () => void;
  setOriginalData: (data: T) => void;
  clearErrors: () => void;
  setError: (field: string, message: string) => void;
}

// ============================================================================
// useFormState Hook
// ============================================================================

export function useFormState<T extends Record<string, unknown>>({
  initialData,
  validate,
}: UseFormStateOptions<T>): UseFormStateReturn<T> {
  const [data, setDataState] = useState<T>(initialData);
  const [originalData, setOriginalData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check for unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(data) !== JSON.stringify(originalData);
  }, [data, originalData]);

  // Validate data
  const validationErrors = useMemo(() => {
    if (!validate) return null;
    return validate(data);
  }, [data, validate]);

  const isValid = useMemo(() => {
    return !validationErrors || Object.keys(validationErrors).length === 0;
  }, [validationErrors]);

  // Update errors when validation changes
  useEffect(() => {
    if (validationErrors) {
      setErrors(validationErrors);
    }
  }, [validationErrors]);

  // Set entire data object
  const setData = useCallback((newData: T | ((prev: T) => T)) => {
    setDataState(newData);
  }, []);

  // Set a single field
  const setField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setDataState((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    setErrors((prev) => {
      if (prev[field as string]) {
        const { [field as string]: _, ...rest } = prev;
        return rest;
      }
      return prev;
    });
  }, []);

  // Reset to initial data
  const reset = useCallback(() => {
    setDataState(initialData);
    setOriginalData(initialData);
    setErrors({});
  }, [initialData]);

  // Reset to original data (discard changes)
  const resetToOriginal = useCallback(() => {
    setDataState(originalData);
    setErrors({});
  }, [originalData]);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Set a specific error
  const setError = useCallback((field: string, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

  return {
    data,
    originalData,
    hasUnsavedChanges,
    errors,
    isValid,
    setData,
    setField,
    reset,
    resetToOriginal,
    setOriginalData,
    clearErrors,
    setError,
  };
}

// ============================================================================
// useFormField Hook (for individual field control)
// ============================================================================

interface UseFormFieldOptions<T> {
  initialValue: T;
  validate?: (value: T) => string | null;
}

interface UseFormFieldReturn<T> {
  value: T;
  error: string | null;
  isDirty: boolean;
  setValue: (value: T) => void;
  reset: () => void;
  setError: (error: string | null) => void;
}

export function useFormField<T>({
  initialValue,
  validate,
}: UseFormFieldOptions<T>): UseFormFieldReturn<T> {
  const [value, setValue] = useState<T>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Validate on change
  useEffect(() => {
    if (isDirty && validate) {
      setError(validate(value));
    }
  }, [value, isDirty, validate]);

  const handleSetValue = useCallback((newValue: T) => {
    setValue(newValue);
    setIsDirty(true);
  }, []);

  const reset = useCallback(() => {
    setValue(initialValue);
    setError(null);
    setIsDirty(false);
  }, [initialValue]);

  return {
    value,
    error,
    isDirty,
    setValue: handleSetValue,
    reset,
    setError,
  };
}

export default useFormState;
