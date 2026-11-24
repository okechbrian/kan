"use client";

interface NumpadProps {
  onPress: (digit: string) => void;
  onDelete: () => void;
  onConfirm?: () => void;
}

export function Numpad({ onPress, onDelete, onConfirm }: NumpadProps) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", onConfirm ? "ok" : "", "0", "del"];

  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map((key) => {
        if (key === "") return <div key="empty" />;
        if (key === "ok") {
          return (
            <button
              key="ok"
              onClick={onConfirm}
              className="h-16 rounded-lg bg-blue-600 text-white text-lg font-semibold active:bg-blue-700"
            >
              OK
            </button>
          );
        }
        if (key === "del") {
          return (
            <button
              key="del"
              onClick={onDelete}
              className="h-16 rounded-lg bg-gray-200 text-gray-700 text-lg font-medium active:bg-gray-300"
            >
              Del
            </button>
          );
        }
        return (
          <button
            key={key}
            onClick={() => onPress(key)}
            className="h-16 rounded-lg bg-white border border-gray-300 text-2xl font-semibold active:bg-gray-100"
          >
            {key}
          </button>
        );
      })}
    </div>
  );
}
