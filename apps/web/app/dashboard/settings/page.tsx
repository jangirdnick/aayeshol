export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account preferences, notifications, API credentials, and application
          configuration.
        </p>
      </div>
      <div className="rounded-xl border border-border/80 bg-card p-8 text-center text-sm text-muted-foreground">
        Account settings and configuration settings.
      </div>
    </div>
  );
}
