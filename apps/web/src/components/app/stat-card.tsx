import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  description?: string;
};

export function StatCard({ icon: Icon, label, value, description }: StatCardProps) {
  return (
    <Card className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
          {description ? <div className="mt-2 text-sm text-slate-500">{description}</div> : null}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
