"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { ApiResponse } from "@/lib/api/client";

// Generic state type for resources
interface ResourceState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

// Generic hook for simple API data fetching
export function useApiData<T>(
  fetchFn: () => Promise<ApiResponse<T>>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize based on deps
  const depsKey = JSON.stringify(deps);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

// Generic hook for single resource fetch by ID
export function useResourceById<T>(
  fetchFn: (id: string) => Promise<ApiResponse<Record<string, T>>>,
  id: string | null,
  key: string
) {
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!id) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    const fetchItem = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await fetchFn(id);

      if (response.error) {
        setState({ data: null, isLoading: false, error: response.error.error });
      } else if (response.data) {
        setState({
          data: response.data[key] as T,
          isLoading: false,
          error: null,
        });
      }
    };

    fetchItem();
  }, [fetchFn, id, key]);

  return state;
}

// Helper to create CRUD operations that refetch after mutation
export function createCrudOperations<T, CreateData, UpdateData>(
  api: {
    create?: (data: CreateData) => Promise<ApiResponse<Record<string, T>>>;
    update?: (id: string, data: UpdateData) => Promise<ApiResponse<Record<string, T>>>;
    delete?: (id: string) => Promise<ApiResponse<unknown>>;
  },
  refetch: () => Promise<void>,
  itemKey: string
) {
  const createItem = async (data: CreateData) => {
    if (!api.create) return { success: false, error: "Create not supported" };

    const response = await api.create(data);
    if (response.data) {
      await refetch();
      return { success: true, item: response.data[itemKey] };
    }
    return { success: false, error: response.error?.error };
  };

  const updateItem = async (id: string, data: UpdateData) => {
    if (!api.update) return { success: false, error: "Update not supported" };

    const response = await api.update(id, data);
    if (response.data) {
      await refetch();
      return { success: true, item: response.data[itemKey] };
    }
    return { success: false, error: response.error?.error };
  };

  const deleteItem = async (id: string) => {
    if (!api.delete) return { success: false, error: "Delete not supported" };

    const response = await api.delete(id);
    if (!response.error) {
      await refetch();
      return { success: true };
    }
    return { success: false, error: response.error?.error };
  };

  return { createItem, updateItem, deleteItem };
}

// Hook for list with standard fetch/state pattern
export function useListResource<T, P = Record<string, unknown>>(
  fetchFn: (params?: P) => Promise<ApiResponse<{ [key: string]: T[] | number }>>,
  params: P | undefined,
  config: { itemsKey: string; totalKey?: string }
) {
  const { itemsKey, totalKey = "total" } = config;

  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paramsKey = JSON.stringify(params || {});

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await fetchFn(params);

    if (response.error) {
      setError(response.error.error);
    } else if (response.data) {
      setItems((response.data[itemsKey] as T[]) || []);
      setTotal((response.data[totalKey] as number) || 0);
    }

    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, total, isLoading, error, refetch: fetchItems };
}
