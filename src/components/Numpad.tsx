"use client";

import { Delete } from "lucide-react";

interface NumpadProps {
  onPress: (digit: string) => void;
  onDelete: () => void;
  onConfirm?: () => void;
}

export function Numpad({ onPress, onDelete, onConfirm }: NumpadProps) {
  const keys = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    onConfirm ? "ok" : "",
    "0",
    "del",
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {keys.map((key) => {
        if (key === "") return <div key="empty" />;
        if (key === "ok") {
          return (
            <button
              type="button"
              key="ok"
              onClick={onConfirm}
              className="flex h-16 items-center justify-center rounded-xl bg-kan-navy text-lg font-bold text-kan-white shadow-sm active:opacity-90"
            >
              OK
            </button>
          );
        }
        if (key === "del") {
          return (
            <button
              type="button"
              key="del"
              onClick={onDelete}
              aria-label="Delete digit"
              className="flex h-16 items-center justify-center gap-1 rounded-xl bg-kan-navy/10 text-base font-bold text-kan-navy active:bg-kan-navy/20"
            >
              <Delete className="h-5 w-5" />
              <span>Del</span>
            </button>
          );
        }
        return (
          <button
            type="button"
            key={key}
            onClick={() => onPress(key)}
            className="ugx-amount flex h-16 items-center justify-center rounded-xl border border-kan-navy/15 bg-white text-2xl font-bold text-kan-navy shadow-sm active:bg-kan-teal/20"
          >
            {key}
          </button>
        );
      })}
    </div>
  );
}
