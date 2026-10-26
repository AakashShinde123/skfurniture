"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Pencil,
  Plus,
  Tags,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { slugify } from "@/lib/slug";
import { ApiClientError } from "@/lib/client/api";
import {
  useAdminCategories,
  useCreateCategory,
  useDeleteCategory,
  useReorderCategories,
  useUpdateCategory,
} from "@/hooks/admin/use-categories";
import type { CategoryDto } from "@/types";

/**
 * Category management (PRD §5) — create, edit, activate/deactivate, reorder
 * and delete (guarded when products still use the category).
 */

interface CategoryDialogState {
  open: boolean;
  category: CategoryDto | null; // null → create mode
}

export function CategoryManager() {
  const { data: categories, isPending } = useAdminCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const reorderMutation = useReorderCategories();
  const deleteMutation = useDeleteCategory();

  const [dialog, setDialog] = useState<CategoryDialogState>({ open: false, category: null });
  const [deleteTarget, setDeleteTarget] = useState<CategoryDto | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const openCreate = () => {
    setName("");
    setDescription("");
    setIsActive(true);
    setDialog({ open: true, category: null });
  };

  const openEdit = (category: CategoryDto) => {
    setName(category.name);
    setDescription(category.description ?? "");
    setIsActive(category.isActive);
    setDialog({ open: true, category });
  };

  const submitDialog = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error("Category name must be at least 2 characters.");
      return;
    }
    try {
      if (dialog.category) {
        await updateMutation.mutateAsync({
          id: dialog.category.id,
          input: { name: trimmed, description: description.trim() || null, isActive },
        });
      } else {
        await createMutation.mutateAsync({
          name: trimmed,
          slug: slugify(trimmed),
          description: description.trim() || null,
          isActive,
        });
      }
      setDialog({ open: false, category: null });
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Saving failed.");
    }
  };

  const move = (category: CategoryDto, direction: -1 | 1) => {
    if (!categories) return;
    const index = categories.findIndex((entry) => entry.id === category.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= categories.length) return;
    const next = [...categories];
    [next[index], next[target]] = [next[target], next[index]];
    reorderMutation.mutate(next.map((entry) => entry.id));
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Delete failed.");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Order controls the homepage “Furniture Categories” grid (left → right, top → bottom).
        </p>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" aria-hidden /> Add category
        </Button>
      </div>

      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Order</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="hidden md:table-cell">Slug</TableHead>
                <TableHead className="text-center">Products</TableHead>
                <TableHead className="text-center">Active</TableHead>
                <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(categories ?? []).map((category, index) => (
                <TableRow key={category.id} className={category.isActive ? "" : "opacity-60"}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => move(category, -1)} disabled={index === 0} aria-label={`Move ${category.name} up`}>
                        <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => move(category, 1)} disabled={index === (categories?.length ?? 0) - 1} aria-label={`Move ${category.name} down`}>
                        <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{category.name}</p>
                    {category.description ? (
                      <p className="line-clamp-1 text-xs text-muted-foreground">{category.description}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                    {category.slug}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{category.productCount ?? 0}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={category.isActive}
                      onCheckedChange={(checked) =>
                        updateMutation.mutate({ id: category.id, input: { isActive: checked } })
                      }
                      aria-label={`${category.isActive ? "Deactivate" : "Activate"} ${category.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(category)} aria-label={`Edit ${category.name}`}>
                        <Pencil className="h-4 w-4" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleteTarget(category)}
                        aria-label={`Delete ${category.name}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create / edit dialog */}
      <Dialog open={dialog.open} onOpenChange={(open) => setDialog({ open, category: dialog.category })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5 text-primary" aria-hidden />
              {dialog.category ? `Edit “${dialog.category.name}”` : "New category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="categoryName">Name *</Label>
              <Input
                id="categoryName"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Dining Tables & Chairs"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                URL: <span className="font-mono">/catalogue?category={slugify(name) || "…"}</span>
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="categoryDescription">Description</Label>
              <Textarea
                id="categoryDescription"
                rows={2}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Short line shown under the category name."
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="categoryActive" className="cursor-pointer">Active (visible on the website)</Label>
              <Switch id="categoryActive" checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false, category: null })}>
              Cancel
            </Button>
            <Button
              onClick={submitDialog}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {dialog.category ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteTarget?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Categories with products cannot be deleted — move those products first. The category
              itself will be removed from the website immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete category"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
