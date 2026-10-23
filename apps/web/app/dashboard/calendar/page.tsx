export default function CalendarPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Publishing Calendar</h1>
        <p className="text-sm text-muted-foreground">
          View scheduled publications, editorial pipeline, and delivery timelines across connected
          social platforms.
        </p>
      </div>
      <div className="rounded-xl border border-border/80 bg-card p-8 text-center text-sm text-muted-foreground">
        Calendar queue view will show delayed BullMQ publication jobs.
      </div>
    </div>
  );
}
