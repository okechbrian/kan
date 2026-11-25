"use client";

import { useState, type ReactNode } from "react";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

export function Tabs({
  items,
  defaultId,
  className = "",
}: {
  items: readonly TabItem[];
  defaultId?: string;
  className?: string;
}) {
  const [activeId, setActiveId] = useState(defaultId ?? items[0]?.id ?? "");
  const active = items.find((item) => item.id === activeId) ?? items[0];

  return (
    <div className={className}>
      <div
        role="tablist"
        className="inline-flex flex-wrap gap-1.5 rounded-xl border border-navy/10 bg-softwhite p-1.5"
      >
        {items.map((item) => {
          const isSelected = item.id === active?.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveId(item.id)}
              className={`min-h-11 rounded-lg px-4 py-2 text-sm font-bold transition ${
                isSelected
                  ? "bg-navy text-softwhite shadow-sm"
                  : "text-navy/70 hover:bg-navy/5 hover:text-navy"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {active ? (
        <div role="tabpanel" className="mt-4">
          {active.content}
        </div>
      ) : null}
    </div>
  );
}
