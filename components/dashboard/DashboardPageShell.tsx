import type { ReactNode } from "react";
import { Avatar } from "./DashboardShell";

export function DashboardPageContainer({ children }: { children: ReactNode }) {
  return <div className="max-w-5xl mx-auto">{children}</div>;
}

export function DashboardPageHeader({
  avatarUrl,
  initials,
  title,
  subtitle,
  actions,
}: {
  avatarUrl?: string | null;
  initials?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
      <div className="flex items-center gap-4 min-w-0">
        {initials !== undefined && (
          <Avatar
            avatarUrl={avatarUrl ?? null}
            initials={initials}
            sizeClass="w-14 h-14"
            textClass="text-lg"
          />
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-white truncate">
            {title}
          </h1>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>

      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
