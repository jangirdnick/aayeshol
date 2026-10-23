export default function AssetsPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Media Assets</h1>
        <p className="text-sm text-muted-foreground">
          Browse, sync, and stream images and video assets from connected Google Drive sources.
        </p>
      </div>
      <div className="rounded-xl border border-border/80 bg-card p-8 text-center text-sm text-muted-foreground">
        Assets media library synced with high-capacity streaming pipelines.
      </div>
    </div>
  );
}
