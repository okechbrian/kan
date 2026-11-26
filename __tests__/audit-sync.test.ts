import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../src/lib/db";
import { seedDemoData } from "../src/lib/seed";
import { addToOutbox, getSyncCursor, pullSync, pushOutbox } from "../src/lib/sync";
import { GET, POST } from "../src/app/api/sync/route";
import * as serverDatabase from "../src/lib/server-db";

let storage: Map<string, string>;
beforeEach(async () => {
  for (const table of db.tables) await table.clear();
  storage = new Map([["duuka_device_token", "shop-A-token"]]);
  vi.stubGlobal("window", { dispatchEvent: vi.fn() });
  vi.stubGlobal("localStorage", { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key,value), removeItem: (key: string) => storage.delete(key) });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("audit regression — durable client sync", () => {
  it("does not acknowledge HTTP 200 with zero saved mutations or a legacy response", async () => {
    await addToOutbox("customers","c","insert",{id:"c"});
    vi.stubGlobal("fetch",vi.fn(async () => new Response(JSON.stringify({applied:0}),{status:200})));
    expect(await pushOutbox()).toEqual({pushed:0,failed:1});
    expect((await db.outbox.toArray())[0].synced_at).toBeNull();
  });
  it("acknowledges only explicitly accepted mutation IDs", async () => {
    await addToOutbox("customers","one","insert",{id:"one"});
    await addToOutbox("customers","two","insert",{id:"two"});
    const rows = await db.outbox.toArray();
    vi.stubGlobal("fetch",vi.fn(async () => new Response(JSON.stringify({protocol:2,acknowledged:[rows[0].id,"unsubmitted-id"]}),{status:200})));
    expect(await pushOutbox()).toEqual({pushed:1,failed:1});
    expect((await db.outbox.get(rows[1].id))?.synced_at).toBeNull();
  });
  it("keeps all pending entries on a network failure", async () => {
    await addToOutbox("sales","sale","insert",{id:"sale"});
    vi.stubGlobal("fetch",vi.fn(async () => {throw new Error("Offline");}));
    expect(await pushOutbox()).toEqual({pushed:0,failed:1});
    expect((await db.outbox.toArray())[0].synced_at).toBeNull();
  });
  it("preserves write order at equal timestamps and never splits a local transaction", async () => {
    const rows=Array.from({length:1002},(_,index)=>({id:`event-${String(1002-index).padStart(4,"0")}`,table:"customers",row_id:"customer",op:"update" as const,payload:JSON.stringify({id:"customer",name:`Edit ${index}`}),created_at:"2026-11-26T09:00:00Z",synced_at:null,sequence:index+1,batch_id:index<501?"first-transaction":"second-transaction"}));
    await db.outbox.bulkAdd(rows);
    const fetcher=vi.fn(async (_url:unknown,options:any)=>{
      const sent=JSON.parse(options.body).mutations;
      expect(sent[0].payload.name).toBe("Edit 0");expect(sent.at(-1).payload.name).toBe("Edit 500");
      return new Response(JSON.stringify({protocol:2,acknowledged:sent.map((m:any)=>m.id)}));
    });
    vi.stubGlobal("fetch",fetcher);
    expect(await pushOutbox()).toEqual({pushed:501,failed:0});
    expect(await db.outbox.filter((row)=>row.synced_at===null).count()).toBe(501);
  }, 30000); // Fake IndexedDB cursor iteration is slow on the Windows runner.
  it("rolls back a malformed pull and does not advance its cursor", async () => {
    await seedDemoData(); await db.outbox.clear();
    const product = (await db.products.toArray())[0];
    storage.set("duuka_sync_cursor","old-cursor");
    vi.stubGlobal("fetch",vi.fn(async () => new Response(JSON.stringify({protocol:2,shop_id:product.shop_id,new_cursor:"new-cursor",rows:{products:[{...product,name:"Should not commit"},{id:7,shop_id:product.shop_id}]}}))));
    expect(await pullSync()).toBeNull();
    expect((await db.products.get(product.id))?.name).toBe(product.name);
    expect(getSyncCursor()).toBe("old-cursor");
    expect(await db.outbox.count()).toBe(0);
  });
  it("does not overwrite unsent edits or echo pulled rows into the outbox", async () => {
    await seedDemoData(); await db.outbox.clear();
    const product = (await db.products.toArray())[0];
    await db.products.update(product.id,{name:"Unsent local edit"});
    const count = await db.outbox.count();
    vi.stubGlobal("fetch",vi.fn(async () => new Response(JSON.stringify({protocol:2,shop_id:product.shop_id,new_cursor:"new-cursor",rows:{products:[{...product,name:"Old remote edit"}]}}))));
    expect(await pullSync()).not.toBeNull();
    expect((await db.products.get(product.id))?.name).toBe("Unsent local edit");
    expect(await db.outbox.count()).toBe(count);
  });
});

/** Exercise the real route and Prisma transaction boundary with a rollback-capable store. */
function serverFixture() {
  vi.stubEnv("DATABASE_URL","postgresql://test.invalid/audit");
  let records: Record<string, Map<string, any>> = {};
  const tables = ["shop","user","product","customer","shift","sale","saleLine","tender","stockMovement","deniLedger","cashMovement","expense","warehouse","batch"];
  for (const table of tables) records[table] = new Map();
  records.shop.set("shop-A",{id:"shop-A",business_id:"business-A",active:true});
  records.shop.set("shop-B",{id:"shop-B",business_id:"business-B",active:true});
  const tx: any = {};
  const matches = (row: any, where: any) => Object.entries(where ?? {}).every(([key,value]: any) => key === "OR" ? value.some((clause: any) => matches(row,clause)) : typeof value === "object" && value !== null && "in" in value ? value.in.includes(row[key]) : row[key] === value);
  for (const table of tables) tx[table] = {
    findUnique:vi.fn(async ({where,include}:any) => {
      const row=records[table].get(where.id);
      if(!row) return null;
      if(table === "sale" && include) return {...row,tenders:Array.from(records.tender.values()).filter((t) => t.sale_id === row.id),sale_lines:Array.from(records.saleLine.values()).filter((l) => l.sale_id === row.id)};
      return row;
    }),
    findMany:vi.fn(async ({where,include}:any) => Array.from(records[table].values()).filter((row) => matches(row,where)).map((row) => table === "sale" && include ? {...row,tenders:Array.from(records.tender.values()).filter((t) => t.sale_id === row.id),sale_lines:Array.from(records.saleLine.values()).filter((line) => line.sale_id === row.id)} : row)),
    create:vi.fn(async ({data}:any) => {if(records[table].has(data.id)) throw new Error("Duplicate"); records[table].set(data.id,data);return data;}),
    createMany:vi.fn(async ({data}:any) => {for(const row of data){if(records[table].has(row.id))throw new Error("Duplicate");records[table].set(row.id,row);}return {count:data.length};}),
    upsert:vi.fn(async ({where,create,update}:any) => {const row=records[table].has(where.id)?{...records[table].get(where.id),...update}:create;records[table].set(where.id,row);return row;}),
    update:vi.fn(async ({where,data}:any) => {const row={...records[table].get(where.id),...data};records[table].set(where.id,row);return row;}),
    updateMany:vi.fn(async ({where,data}:any) => {for(const [id,row] of Array.from(records[table])) if(matches(row,where)) records[table].set(id,{...row,...data});}),
  };
  tx.deniLedger.groupBy = vi.fn(async () => []);
  tx.device = {findUnique:vi.fn(async ({where}:any) => where.token === "shop-A-token" ? {shop_id:"shop-A",shop:records.shop.get("shop-A")} : null)};
  const prisma = {...tx,$disconnect:vi.fn(async () => {}),$transaction:vi.fn(async (callback:any) => {
    const before = structuredClone(records);
    try{return await callback(tx);}catch(error){records=before;throw error;}
  })};
  vi.spyOn(serverDatabase,"getServerDb").mockReturnValue(prisma as any);
  const request = (mutations:any[]) => new Request("http://localhost/api/sync",{method:"POST",headers:{authorization:"Bearer shop-A-token"},body:JSON.stringify({mutations})});
  const mutation = (table:string,row_id:string,payload:any,id=row_id) => ({id,table,row_id,op:"insert",payload});
  return {tx,prisma,request,mutation,records:() => records};
}

describe("audit regression — server authorization and commit acknowledgements", () => {
  it("rejects cross-shop device/token creation and business mutations", async () => {
    const f = serverFixture();
    for(const table of ["devices","businesses","accounts","outbox"]) {
      const result=await POST(f.request([f.mutation(table,"evil",{shop_id:"shop-B",token:"chosen-token"})]));
      expect(result.status).toBe(400);
      expect(await result.json()).not.toHaveProperty("acknowledged");
    }
  });
  it("rejects foreign shops, forged parent relationships, and existing foreign user IDs", async () => {
    const f=serverFixture();
    f.records().user.set("foreign-user",{id:"foreign-user",business_id:"business-B",shop_id:"shop-B",role:"attendant"});
    const cases=[f.mutation("shops","shop-B",{business_id:"business-A"}),f.mutation("users","foreign-user",{business_id:"business-A",shop_id:"shop-A",role:"attendant"}),f.mutation("tenders","t",{sale_id:"foreign-sale"})];
    for(const m of cases) expect((await POST(f.request([m]))).status).toBe(403);
    expect(f.records().user.get("foreign-user").business_id).toBe("business-B");
  });
  it("acknowledges committed rows and treats duplicate inserts as idempotent", async () => {
    const f=serverFixture();
    const m=f.mutation("customers","customer-A",{shop_id:"shop-A",name:"Mary",phone:"",notes:"",balance:0});
    for(let i=0;i<2;i++) {
      const response=await POST(f.request([m]));
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({protocol:2,acknowledged:[m.id]});
    }
    expect(f.records().customer.size).toBe(1);
  });
  it("persists a balanced sale atomically and rejects a second device's duplicate void", async () => {
    const f=serverFixture();
    f.records().user.set("owner",{id:"owner",business_id:"business-A",shop_id:null,role:"owner",active:true});
    f.records().product.set("product",{id:"product",shop_id:"shop-A"});
    f.records().shift.set("shift",{id:"shift",shop_id:"shop-A"});
    const sale={shop_id:"shop-A",shift_id:"shift",user_id:"owner",customer_id:null,total:5000,status:"completed",void_reason:"",note:"",created_at:"2026-11-26T09:00:00Z"};
    const batch=[f.mutation("sales","sale",sale),f.mutation("sale_lines","line",{sale_id:"sale",product_id:"product",qty:1,unit_price:5000,line_total:5000,buying_price_snapshot:4000}),f.mutation("tenders","tender",{sale_id:"sale",method:"cash",amount:5000,amount_tendered:5000,change:0})];
    for(let i=0;i<2;i++) expect((await POST(f.request(batch))).status).toBe(200);
    expect(f.records().sale.size).toBe(1);
    const voidBatch=[{...f.mutation("sales","sale",{...sale,status:"voided",void_reason:"Return"},"void-event"),op:"void"},f.mutation("stock_movements","reversal",{shop_id:"shop-A",product_id:"product",type:"void",qty_delta:1,reason:"Return",user_id:"owner",created_at:"2026-11-26T10:00:00Z",ref_id:"sale"})];
    expect((await POST(f.request(voidBatch))).status).toBe(200);
    expect((await POST(f.request(voidBatch))).status).toBe(200);
    const otherDevice=[voidBatch[0],{...voidBatch[1],id:"other-event",row_id:"different-reversal"}];
    expect((await POST(f.request(otherDevice))).status).toBe(409);
    expect(f.records().stockMovement.size).toBe(1);
  });
  it("rolls back the entire batch and sends no acknowledgement on a database failure", async () => {
    const f=serverFixture();
    f.tx.customer.createMany.mockImplementationOnce(async ({data}:any) => {f.records().customer.set(data[0].id,data[0]);throw new Error("Database unavailable");});
    const result=await POST(f.request([f.mutation("customers","one",{shop_id:"shop-A",name:"One"}),f.mutation("customers","two",{shop_id:"shop-A",name:"Two"})]));
    expect(result.status).toBe(409);
    expect(await result.json()).not.toHaveProperty("acknowledged");
    expect(f.records().customer.size).toBe(0);
  });
  it("applies only changed catalogue fields so receiving cannot undo a newer name", async () => {
    const f=serverFixture();
    f.records().product.set("p",{id:"p",shop_id:"shop-A",name:"New remote name",selling_price:5000,buying_price:4000});
    const response=await POST(f.request([{...f.mutation("products","p",{shop_id:"shop-A",name:"Stale local name",selling_price:5000,buying_price:4500,__changed_fields:["buying_price"]}),op:"update"}]));
    expect(response.status).toBe(200);expect(f.records().product.get("p").name).toBe("New remote name");expect(f.records().product.get("p").buying_price).toBe(4500);
  });
  it("pulls old voids and closed shifts on every snapshot without invalid timestamp filters", async () => {
    const f=serverFixture();
    f.records().shift.set("old-shift",{id:"old-shift",shop_id:"shop-A",opened_at:new Date("2026-01-01"),status:"closed"});
    const response=await GET(new Request("http://localhost/api/sync?since=2026-11-25T00:00:00Z",{headers:{authorization:"Bearer shop-A-token"}}));
    expect(response.status).toBe(200);
    const body=await response.json();
    expect(body.rows.shifts[0].status).toBe("closed");
    expect(f.tx.shift.findMany).toHaveBeenCalledWith({where:{shop_id:"shop-A"}});
    expect(body.rows.shops.every((s:any) => s.id === "shop-A")).toBe(true);
  });
});
