import { IconLoader2 } from "@tabler/icons-react";

import { APP_TITLE } from "@/lib/app-config";

/**
 * Visible shell while `/home` hydrates or heavy home chunks load.
 * Avoids a blank dark main that looks like a hang.
 */
export default function HomeLoading({
  label = "Loading…",
}: {
  label?: string;
}) {
  return (
    <div
      className="flex min-h-full flex-col items-center justify-center gap-4 px-4 py-16 text-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <IconLoader2
        className="size-8 text-muted-foreground motion-safe:animate-spin"
        aria-hidden="true"
      />
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-medium text-foreground">{APP_TITLE}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
