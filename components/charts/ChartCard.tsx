import type { ReactNode } from "react";
import { clsx } from "clsx";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function ChartCard({ title, subtitle, actions, className, children }: ChartCardProps) {
  return (
    <section
      className={clsx(
        "rounded-fathom border border-border bg-surface p-4 sm:p-5",
        className
      )}
    >
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-muted">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}
