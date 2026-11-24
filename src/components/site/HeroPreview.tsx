const PANELS = [
  {
    label: "Today's sales",
    empty: "No sales recorded yet",
    detail: "Open the till to begin",
    icon: "◷",
  },
  {
    label: "Stock alerts",
    empty: "No low-stock items",
    detail: "Stock appears after your first receive",
    icon: "▤",
  },
  {
    label: "Channels",
    empty: "Online store not open yet",
    detail: "Storefront opens with the online store release",
    icon: "◍",
  },
];

export function HeroPreview() {
  return (
    <div className="rounded-3xl border border-black/5 bg-white p-3 shadow-2xl shadow-kan/10 sm:p-5">
      <div className="flex items-center gap-2 border-b border-black/5 pb-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-kan text-sm font-black text-white">
          K
        </span>
        <span className="text-sm font-bold text-ink">Kan dashboard</span>
        <span className="ml-auto rounded-full bg-kan-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-kan-dark">
          Preview
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {PANELS.map((panel) => (
          <div
            key={panel.label}
            className="rounded-xl border border-dashed border-black/10 bg-cream/60 p-4"
          >
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink/40">
              <span aria-hidden="true">{panel.icon}</span>
              {panel.label}
            </div>
            <p className="mt-3 text-sm font-semibold text-ink/70">{panel.empty}</p>
            <p className="mt-1 text-xs leading-snug text-ink/40">{panel.detail}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-ink px-4 py-3 text-xs text-white/70">
        <span className="font-bold text-white">Point of sale</span>
        <span className="text-white/30">·</span>
        <span>Open a shift, add items, charge</span>
        <span className="ml-auto rounded-full bg-white/10 px-2.5 py-1 font-bold text-white">
          Available now
        </span>
      </div>
    </div>
  );
}
