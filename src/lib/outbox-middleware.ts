import Dexie, { type DBCore } from "dexie";
import { SYNC_TABLE_SET, REMOTE_TRANSACTION } from "./sync-tables";
import { generateId } from "./uuid";

/** Capture full rows in the SAME IndexedDB transaction, including implicit writes. */
export function outboxMiddleware(core: DBCore): DBCore {
  const batches = new WeakMap<object, string>();
  return {
    ...core,
    transaction(stores, mode, options) {
      const names = mode === "readwrite" && stores.some((name) => SYNC_TABLE_SET.has(name))
        ? Array.from(new Set([...stores, "outbox"])) : stores;
      const transaction = core.transaction(names, mode, options);
      batches.set(transaction, generateId());
      return transaction;
    },
    table(name) {
      const table = core.table(name);
      if (!SYNC_TABLE_SET.has(name)) return table;
      return {
        ...table,
        async mutate(request) {
          const remote = (Dexie.currentTransaction as unknown as Record<string, unknown> | null)?.[REMOTE_TRANSACTION];
          const previous = !remote && request.type === "put"
            ? await table.getMany({ trans: request.trans, keys: request.keys ?? request.values.map((row) => row.id) }) : [];
          const result = await table.mutate(request);
          if (remote || (request.type !== "add" && request.type !== "put")) return result;
          try {
            const keys = result.results ?? request.keys ?? request.values.map((row) => row.id);
            const rows = await table.getMany({ trans: request.trans, keys });
            const entries = rows.flatMap((row, index) => {
              if (!row || result.failures[index]) return [];
              let changedFields: string[] | undefined;
              // Stock and deni balances are derived fields. A sale/collection must not
              // upload a stale catalogue snapshot just because its projection changed.
              if (previous[index] && ["products", "customers"].includes(name)) {
                const ignored = new Set(["stock_qty", "balance", "server_updated_at", "published_online"]);
                const fields = new Set([...Object.keys(row), ...Object.keys(previous[index])]);
                changedFields = Array.from(fields).filter((key) => !ignored.has(key) && row[key] !== previous[index][key]);
                if (!changedFields.length) return [];
              }
              return [{
                id: generateId(), table: name, row_id: row.id,
                op: name === "sales" && row.status === "voided" ? "void" : request.type === "add" ? "insert" : "update",
                payload: JSON.stringify(changedFields ? { ...row, __changed_fields: changedFields } : row), created_at: new Date().toISOString(), synced_at: null,
              }];
            });
            if (entries.length) {
              const outbox = core.table("outbox");
              const offset = await outbox.count({ trans: request.trans, query: { index: outbox.schema.primaryKey, range: { type: 3, lower: core.MIN_KEY, upper: core.MAX_KEY } } });
              const values = entries.map((entry, index) => ({ ...entry, sequence: offset + index + 1, batch_id: batches.get(request.trans) }));
              const queued = await outbox.mutate({ type: "add", trans: request.trans, values });
              if (queued.numFailures) throw new Error("Could not save sync outbox");
            }
            return result;
          } catch (error) {
            request.trans.abort();
            throw error;
          }
        },
      };
    },
  };
}
