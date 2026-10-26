"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, apiUpload } from "@/lib/client/api";
import type { DashboardStatsDto, SiteSettingsDto } from "@/types";

export interface MediaAssetClientDto {
  id: string;
  key: string;
  filename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  url: string;
  createdAt: string;
}

/** Dashboard stats. */
export function useDashboardStats() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => api.get<DashboardStatsDto>("/api/dashboard"),
  });
}

/** Site settings (singletons cached briefly in the client store). */
export function useSiteSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<SiteSettingsDto>("/api/settings"),
    staleTime: 60_000,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) => api.put<SiteSettingsDto>("/api/settings", input),
    onSuccess: (settings) => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Website settings saved — changes are live immediately.");
      return settings;
    },
  });
}

/** Media library. */
export function useMediaLibrary() {
  return useQuery({
    queryKey: ["admin", "media"],
    queryFn: () => api.get<MediaAssetClientDto[]>("/api/media"),
  });
}

export function useUploadMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, folder }: { file: File; folder?: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder ?? "products");
      return apiUpload("/api/upload", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
    },
  });
}

export function useManageMedia() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
  };

  return useMutation({
    mutationFn: (input: { action: "delete" | "setAlt"; key: string; altText?: string | null }) =>
      api.post<{ ok?: true } | MediaAssetClientDto>("/api/media/manage", input),
    onSuccess: (_data, variables) => {
      invalidate();
      if (variables.action === "delete") toast.success("Image removed from the library.");
      else toast.success("Alt text saved.");
    },
  });
}
