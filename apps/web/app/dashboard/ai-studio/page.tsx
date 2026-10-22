export default function AiStudioPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">AI Content Studio</h1>
        <p className="text-sm text-muted-foreground">
          Craft platform-optimized captions, hashtags, and social post copies powered by Gemini AI.
        </p>
      </div>
      <div className="rounded-xl border border-border/80 bg-card p-8 text-center text-sm text-muted-foreground">
        AI Studio workbench is ready for prompt orchestration.
      </div>
    </div>
  );
}
