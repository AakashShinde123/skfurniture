"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/client/api";
import type { CategoryDto } from "@/types";

/** Admin category hooks. */

export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => api.get<CategoryDto[]>("/api/categories?includeInactive=1"),
  });
}

function useInvalidateCategories() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    queryClient.invalidateQueries({ queryKey: ["catalogue"] });
  };
}

export function useCreateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (input: unknown) => api.post<CategoryDto>("/api/categories", input),
    onSuccess: (category) => {
      invalidate();
      toast.success(`Category “${category.name}” created.`);
    },
  });
}

export function useUpdateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: unknown }) =>
      api.put<CategoryDto>(`/api/categories/${id}`, input),
    onSuccess: (category) => {
      invalidate();
      toast.success(`Category “${category.name}” updated.`);
    },
  });
}

export function useReorderCategories() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (orderedIds: string[]) => api.post<CategoryDto[]>("/api/categories/reorder", { orderedIds }),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ ok: true }>(`/api/categories/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success("Category deleted.");
    },
  });
}
