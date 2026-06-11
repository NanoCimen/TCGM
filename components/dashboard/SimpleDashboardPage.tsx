"use client";

import DashboardShell, {
  Avatar,
  type DashboardNavKey,
} from "./DashboardShell";

export default function SimpleDashboardPage({
  active,
  title,
  emptyTitle,
  emptySubtitle,
  displayName,
  email,
  avatarUrl,
}: {
  active: DashboardNavKey;
  title: string;
  emptyTitle: string;
  emptySubtitle: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
}) {
  const name = displayName || email;
  const initials = name.substring(0, 2).toUpperCase();

  return (
    <DashboardShell active={active} avatarUrl={avatarUrl} initials={initials}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <Avatar
            avatarUrl={avatarUrl}
            initials={initials}
            sizeClass="w-14 h-14"
            textClass="text-lg"
          />
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-white">
              {title}
            </h1>
            <p className="text-sm text-gray-500 truncate">{name}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-gray-800 py-20 text-center">
          <h3 className="text-xl font-extrabold text-white mb-2">
            {emptyTitle}
          </h3>
          <p className="text-sm text-gray-500">{emptySubtitle}</p>
        </div>
      </div>
    </DashboardShell>
  );
}
