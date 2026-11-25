import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  numeric?: boolean;
  render: (row: T) => ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = "No records to display yet.",
}: {
  columns: readonly DataTableColumn<T>[];
  rows: readonly T[];
  rowKey: (row: T, index: number) => string;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-navy/15 bg-softwhite p-6 text-center text-sm text-navy/65">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-navy/10 bg-softwhite">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-4 py-3 text-xs font-bold uppercase tracking-wide text-navy/65 ${
                  col.align === "right" ? "text-right" : "text-left"
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-navy/5">
          {rows.map((row, idx) => (
            <tr key={rowKey(row, idx)} className="hover:bg-teal-soft/25">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 text-navy ${
                    col.align === "right" ? "text-right" : "text-left"
                  } ${col.numeric ? "ugx-amount font-semibold" : ""}`}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
