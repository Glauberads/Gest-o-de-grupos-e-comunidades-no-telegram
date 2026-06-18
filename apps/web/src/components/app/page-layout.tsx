import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PageLayoutProps = {
  title: string;
  description: string;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "danger" | "info" | "dark";
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function PageLayout({
  title,
  description,
  badge,
  badgeVariant = "info",
  actions,
  children,
  className
}: PageLayoutProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <section className="rounded-[28px] border border-slate-800 bg-[linear-gradient(180deg,_rgba(11,20,37,0.96)_0%,_rgba(15,23,42,0.98)_100%)] px-6 py-6 shadow-[0_24px_80px_rgba(2,6,23,0.35)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            {badge ? <Badge variant={badgeVariant}>{badge}</Badge> : null}
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-400 md:text-base">
              {description}
            </p>
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </section>
      {children}
    </div>
  );
}
