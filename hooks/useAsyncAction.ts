"use client";

import { useState, useCallback } from "react";
import { showToast } from "@/components/settings/shared";

// ============================================================================
// Types
// ============================================================================

interface UseAsyncActionOptions<TResult> {
  onSuccess?: (result: TResult) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

interface UseAsyncActionReturn<TArgs extends unknown[], TResult> {
  execute: (...args: TArgs) => Promise<TResult | undefined>;
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
}

// ============================================================================
// useAsyncAction Hook
// ============================================================================

export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  options: UseAsyncActionOptions<TResult> = {}
): UseAsyncActionReturn<TArgs, TResult> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { onSuccess, onError, successMessage, errorMessage } = options;

  const execute = useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await action(...args);

        if (successMessage) {
          showToast(successMessage, "success");
        }

        onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);

        if (errorMessage) {
          showToast(errorMessage, "error");
        }

        onError?.(error);
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [action, onSuccess, onError, successMessage, errorMessage]
  );

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    execute,
    isLoading,
    error,
    reset,
  };
}

// ============================================================================
// useSaveAction Hook (specialized for save operations)
// ============================================================================

interface UseSaveActionOptions<T> {
  saveFunction: (data: T) => Promise<void>;
  onSuccess?: () => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useSaveAction<T>({
  saveFunction,
  onSuccess,
  successMessage = "Saved successfully",
  errorMessage = "Failed to save",
}: UseSaveActionOptions<T>) {
  return useAsyncAction(saveFunction, {
    onSuccess,
    successMessage,
    errorMessage,
  });
}

// ============================================================================
// useDeleteAction Hook (specialized for delete operations)
// ============================================================================

interface UseDeleteActionOptions<T> {
  deleteFunction: (item: T) => Promise<void>;
  onSuccess?: () => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useDeleteAction<T>({
  deleteFunction,
  onSuccess,
  successMessage = "Deleted successfully",
  errorMessage = "Failed to delete",
}: UseDeleteActionOptions<T>) {
  return useAsyncAction(deleteFunction, {
    onSuccess,
    successMessage,
    errorMessage,
  });
}

// ============================================================================
// useFetchAction Hook (specialized for fetch operations)
// ============================================================================

interface UseFetchActionOptions<T> {
  fetchFunction: () => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useFetchAction<T>({
  fetchFunction,
  onSuccess,
  onError,
}: UseFetchActionOptions<T>) {
  return useAsyncAction(fetchFunction, {
    onSuccess,
    onError,
    // No toast messages for fetch by default
  });
}

export default useAsyncAction;
