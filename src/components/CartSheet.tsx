"use client";

import { ugx } from "../lib/money";

export interface CartLine {
  productId: string;
  name: string;
  unitPrice: number;
  qty: number;
}

interface CartSheetProps {
  lines: CartLine[];
  onUpdateQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  onCharge: () => void;
}

export function CartSheet({ lines, onUpdateQty, onRemove, onCharge }: CartSheetProps) {
  if (lines.length === 0) return null;

  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);

  return (
    <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30">
      <div className="max-w-md mx-auto p-3">
        <div className="max-h-48 overflow-y-auto mb-2">
          {lines.map((line) => (
            <div key={line.productId} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{line.name}</p>
                <p className="text-xs text-gray-500">{ugx(line.unitPrice)}</p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={() => onUpdateQty(line.productId, line.qty - 1)}
                  className="w-7 h-7 rounded bg-gray-200 text-gray-700 font-bold flex items-center justify-center active:bg-gray-300"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-medium">{line.qty}</span>
                <button
                  onClick={() => onUpdateQty(line.productId, line.qty + 1)}
                  className="w-7 h-7 rounded bg-gray-200 text-gray-700 font-bold flex items-center justify-center active:bg-gray-300"
                >
                  +
                </button>
                <button
                  onClick={() => onRemove(line.productId)}
                  className="w-7 h-7 rounded bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center active:bg-red-200"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Total</span>
          <span className="text-lg font-bold">{ugx(total)}</span>
        </div>

        <button
          onClick={onCharge}
          className="w-full rounded-lg bg-green-600 py-3 text-white text-lg font-semibold active:bg-green-700"
        >
          Charge {ugx(total)}
        </button>
      </div>
    </div>
  );
}
