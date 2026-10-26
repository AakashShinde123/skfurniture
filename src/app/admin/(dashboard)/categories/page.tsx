import { CategoryManager } from "@/components/admin/category-manager";

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Group products into collections customers can browse — sofas, beds, dining and more.
        </p>
      </div>
      <CategoryManager />
    </div>
  );
}
