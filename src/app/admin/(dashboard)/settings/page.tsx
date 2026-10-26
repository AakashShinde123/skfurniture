import { SettingsForm } from "@/components/admin/settings-form";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Site Settings</h1>
        <p className="text-sm text-muted-foreground">
          Shop identity, contact details, homepage hero and default SEO — no code changes needed.
        </p>
      </div>
      <SettingsForm />
    </div>
  );
}
