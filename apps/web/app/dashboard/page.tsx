import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sparkles, Share2, CheckCircle2, Clock } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground">
          Real-time metrics, scheduled publication pipeline, and social connectivity status.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-border/70 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Posts</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14</div>
            <p className="text-xs text-muted-foreground mt-1">4 publishing in next 24h</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Published Today</CardTitle>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground mt-1">+12% from yesterday</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Connected Accounts</CardTitle>
            <Share2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4 / 4</div>
            <p className="text-xs text-muted-foreground mt-1">LinkedIn, X, Instagram, YouTube</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">AI Generation Tokens</CardTitle>
            <Sparkles className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.4k</div>
            <p className="text-xs text-muted-foreground mt-1">Gemini 2.5 Pro Assistant active</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
