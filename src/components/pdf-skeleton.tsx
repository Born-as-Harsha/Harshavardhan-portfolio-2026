/**
 * Placeholder that mirrors the final PDF viewer chrome (toolbar, thumbnail
 * rail, page viewport, zoom / pagination controls) so swapping in the real
 * document causes no layout shift.
 */
export function PdfSkeleton({ label = "Loading certificate preview…" }: { label?: string }) {
  return (
    <div className="animate-pulse" aria-hidden>
      {/* toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-foreground/10" />
          <div className="h-3 w-24 rounded bg-foreground/10" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-6 w-6 rounded-md bg-foreground/10" />
          <div className="h-3 w-10 rounded bg-foreground/10" />
          <div className="h-6 w-6 rounded-md bg-foreground/10" />
        </div>
      </div>

      <div className="flex h-[60vh]">
        {/* thumbnail rail */}
        <div className="hidden w-24 shrink-0 flex-col gap-3 border-r border-border/60 p-3 sm:flex">
          {[0, 1, 2].map((i) => (
            <div key={i} className="aspect-[1/1.414] w-full rounded-sm bg-foreground/10" />
          ))}
        </div>

        {/* page viewport */}
        <div className="flex flex-1 items-start justify-center overflow-hidden p-4">
          <div className="aspect-[1/1.414] h-full max-h-full w-auto max-w-full rounded-sm bg-foreground/10 p-6">
            <div className="space-y-3">
              <div className="h-4 w-1/2 rounded bg-foreground/10" />
              <div className="h-2.5 w-3/4 rounded bg-foreground/10" />
              <div className="h-2.5 w-2/3 rounded bg-foreground/10" />
              <div className="h-24 w-full rounded bg-foreground/10" />
              <div className="h-2.5 w-1/2 rounded bg-foreground/10" />
            </div>
          </div>
        </div>
      </div>

      {/* pagination */}
      <div className="flex items-center justify-center gap-2 border-t border-border/60 px-3 py-2.5">
        <div className="h-6 w-6 rounded-md bg-foreground/10" />
        <div className="h-3 w-16 rounded bg-foreground/10" />
        <div className="h-6 w-6 rounded-md bg-foreground/10" />
      </div>

      <span className="sr-only">{label}</span>
    </div>
  );
}