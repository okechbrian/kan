import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { GET, POST } from "../src/app/api/sync/route";
import * as serverDatabase from "../src/lib/server-db";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Opt in explicitly: this creates isolated records in the configured database and
// deletes only the generated IDs below. Normal unit/CI runs never touch a cloud DB.
describe.skipIf(process.env.KAN_SYNC_INTEGRATION !== "1")("isolated Postgres sync roundtrip", () => {
  let prisma: PrismaClient;
  const id = (label: string) => `audit-${label}-${randomUUID()}`;
  const businessA=id("business-A"),businessB=id("business-B"),shopA=id("shop-A"),shopB=id("shop-B"),userA=id("owner-A"),userB=id("owner-B"),productA=id("product-A"),productB=id("product-B"),shiftA=id("shift-A"),customerA=id("customer-A");
  const tokenA=randomUUID(),tokenA2=randomUUID(),tokenB=randomUUID();
  const cleanupManifest=join(tmpdir(),id("kan-sync-cleanup")+".json");
  let setupCommitted=false;
  const sales: string[]=[];
  const now="2026-11-26T09:00:00.000Z";
  const mutation=(table:string,row_id:string,payload:unknown,op="insert")=>({id:id("event"),table,row_id,op,payload});
  const push=async(mutations:unknown[],token=tokenA)=>POST(new Request("http://localhost/api/sync",{method:"POST",headers:{authorization:`Bearer ${token}`},body:JSON.stringify({mutations})}));
  const pull=async(token=tokenA)=>GET(new Request("http://localhost/api/sync?since=2099-01-01T00:00:00Z",{headers:{authorization:`Bearer ${token}`}}));
  function saleBatch(qty:number,credit=false) {
    const saleId=id("sale");sales.push(saleId);
    const sale={id:saleId,shop_id:shopA,shift_id:shiftA,user_id:userA,customer_id:credit?customerA:null,created_at:now,status:"completed",void_reason:"",total:qty*5000,note:"Isolated audit test"};
    return {saleId,sale,batch:[mutation("sales",saleId,sale),mutation("sale_lines",id("line"),{sale_id:saleId,product_id:productA,qty,unit_price:5000,line_total:qty*5000,buying_price_snapshot:4000}),mutation("tenders",id("tender"),{sale_id:saleId,method:credit?"credit":"cash",amount:qty*5000,amount_tendered:qty*5000,change:0}),mutation("stock_movements",id("movement"),{shop_id:shopA,product_id:productA,type:"sale",qty_delta:-qty,reason:"",user_id:userA,created_at:now,ref_id:saleId}),...(credit?[mutation("deni_ledger",id("credit"),{shop_id:shopA,customer_id:customerA,type:"sale_credit",amount:qty*5000,sale_id:saleId,user_id:userA,created_at:now,note:""})]:[])]};
  }
  beforeAll(async()=>{
    // Next intentionally skips .env.local in NODE_ENV=test. This opt-in test uses
    // Node's env-file parser explicitly; credentials are never printed.
    process.loadEnvFile(".env.local");
    if(!process.env.DATABASE_URL) throw new Error("Integration database not configured");
    const connection = new URL(process.env.DATABASE_URL);
    connection.searchParams.set("connect_timeout", "20");
    connection.searchParams.set("pool_timeout", "20");
    connection.searchParams.set("connection_limit", "1");
    process.env.DATABASE_URL = connection.toString();
    prisma=new PrismaClient();
    vi.spyOn(serverDatabase,"getServerDb").mockReturnValue(prisma);
    await prisma.$transaction(async(tx)=>{
      await tx.business.createMany({data:[{id:businessA,name:"Isolated Kan audit A"},{id:businessB,name:"Isolated Kan audit B"}]});
      await tx.shop.createMany({data:[{id:shopA,business_id:businessA,name:"Audit A",shop_code:id("code-A")},{id:shopB,business_id:businessB,name:"Audit B",shop_code:id("code-B")}]});
      await tx.user.createMany({data:[{id:userA,business_id:businessA,shop_id:null,name:"Audit owner A",role:"owner",pin_hash:"not-a-real-pin"},{id:userB,business_id:businessB,shop_id:null,name:"Audit owner B",role:"owner",pin_hash:"not-a-real-pin"}]});
      await tx.device.createMany({data:[{id:id("device-A"),shop_id:shopA,token:tokenA,name:"Audit A"},{id:id("device-A2"),shop_id:shopA,token:tokenA2,name:"Audit A2"},{id:id("device-B"),shop_id:shopB,token:tokenB,name:"Audit B"}]});
      await tx.product.createMany({data:[{id:productA,shop_id:shopA,name:"Audit sugar",unit:"pc",selling_price:5000,buying_price:4000},{id:productB,shop_id:shopB,name:"Audit soap",unit:"pc",selling_price:3500,buying_price:2500}]});
      await tx.stockMovement.createMany({data:[{id:id("opening-A"),shop_id:shopA,product_id:productA,type:"receive",qty_delta:20,user_id:userA},{id:id("opening-B"),shop_id:shopB,product_id:productB,type:"receive",qty_delta:10,user_id:userB}]});
      await tx.shift.create({data:{id:shiftA,shop_id:shopA,user_id:userA,opening_float:50000,opened_at:new Date(now)}});
      await tx.customer.create({data:{id:customerA,shop_id:shopA,name:"Audit customer"}});
    },{timeout:30000});
    setupCommitted=true;
    writeFileSync(cleanupManifest,JSON.stringify({businesses:[businessA,businessB],shops:[shopA,shopB]}));
  },180000);
  afterAll(async()=>{
    if(!prisma)return;
    if(!setupCommitted){await prisma.$disconnect();vi.restoreAllMocks();return;}
    const shops=[shopA,shopB],businesses=[businessA,businessB];
    try{
      await prisma.$transaction(async(tx)=>{
        await tx.saleLine.deleteMany({where:{sale_id:{in:sales}}});
        await tx.tender.deleteMany({where:{sale_id:{in:sales}}});
        await tx.stockMovement.deleteMany({where:{shop_id:{in:shops}}});
        await tx.deniLedger.deleteMany({where:{shop_id:{in:shops}}});
        await tx.cashMovement.deleteMany({where:{shop_id:{in:shops}}});
        await tx.sale.deleteMany({where:{shop_id:{in:shops}}});
        await tx.shift.deleteMany({where:{shop_id:{in:shops}}});
        await tx.product.deleteMany({where:{shop_id:{in:shops}}});
        await tx.customer.deleteMany({where:{shop_id:{in:shops}}});
        await tx.device.deleteMany({where:{shop_id:{in:shops}}});
        await tx.user.deleteMany({where:{business_id:{in:businesses}}});
        await tx.shop.deleteMany({where:{id:{in:shops}}});
        await tx.business.deleteMany({where:{id:{in:businesses}}});
      },{timeout:30000});
      expect(await prisma.business.count({where:{id:{in:businesses}}})).toBe(0);
      unlinkSync(cleanupManifest);
    }finally{await prisma.$disconnect();vi.restoreAllMocks();}
  },180000);

  it("isolates tokens and persists both devices' sales exactly once",async()=>{
    expect((await push([mutation("devices",id("forged"),{shop_id:shopB,token:"forged",name:"Blocked"})])).status).toBe(400);
    const first=saleBatch(2),second=saleBatch(1);
    for(const [batch,token] of [[first.batch,tokenA],[second.batch,tokenA2],[first.batch,tokenA]] as const){
      const response=await push(batch,token);const body=await response.json();expect(body,JSON.stringify(body)).toHaveProperty("acknowledged");expect(response.status).toBe(200);
    }
    const response=await pull();expect(response.status).toBe(200);const snapshot=await response.json();
    expect(snapshot.rows.sales).toHaveLength(2);
    expect(snapshot.rows.stock_movements.reduce((sum:number,row:any)=>sum+row.qty_delta,0)).toBe(17);
    expect(snapshot.rows.products.every((row:any)=>row.shop_id===shopA)).toBe(true);
    const other=await (await pull(tokenB)).json();expect(other.rows.sales).toHaveLength(0);
    expect(other.rows.stock_movements.reduce((sum:number,row:any)=>sum+row.qty_delta,0)).toBe(10);
  },180000);
  it("roundtrips credit, collection, void, and a later shift close",async()=>{
    const credit=saleBatch(1,true);
    expect((await push(credit.batch)).status).toBe(200);
    expect((await prisma.customer.findUnique({where:{id:customerA}}))?.balance).toBe(5000);
    const collection=[mutation("deni_ledger",id("collection"),{shop_id:shopA,customer_id:customerA,type:"collection",amount:-2000,sale_id:"",user_id:userA,created_at:now,note:"Audit"}),mutation("cash_movements",id("collection-cash"),{shop_id:shopA,shift_id:shiftA,type:"collection_cash",amount:2000,reason:"Audit",user_id:userA,created_at:now})];
    expect((await push(collection)).status).toBe(200);
    expect((await prisma.customer.findUnique({where:{id:customerA}}))?.balance).toBe(3000);
    const reversals=[mutation("sales",credit.saleId,{...credit.sale,status:"voided",void_reason:"Audit return"},"void"),mutation("stock_movements",id("void-stock"),{shop_id:shopA,product_id:productA,type:"void",qty_delta:1,reason:"Audit return",user_id:userA,created_at:now,ref_id:credit.saleId}),mutation("deni_ledger",id("void-deni"),{shop_id:shopA,customer_id:customerA,type:"void",amount:-5000,sale_id:credit.saleId,user_id:userA,created_at:now,note:"Audit return"})];
    expect((await push(reversals)).status).toBe(200);expect((await push(reversals)).status).toBe(200);
    expect((await prisma.customer.findUnique({where:{id:customerA}}))?.balance).toBe(-2000);
    const shift=await prisma.shift.findUniqueOrThrow({where:{id:shiftA}});
    const closed=JSON.parse(JSON.stringify({...shift,status:"closed",closed_at:new Date(),expected_cash:67000,counted_cash:67000,variance:0}));
    expect((await push([mutation("shifts",shiftA,closed,"update")])).status).toBe(200);
    const snapshot=await (await pull(tokenA2)).json();
    expect(snapshot.rows.shifts[0].status).toBe("closed");expect(snapshot.rows.shifts[0].expected_cash).toBe(67000);
    expect(snapshot.rows.sales.find((row:any)=>row.id===credit.saleId).status).toBe("voided");
    expect(snapshot.rows.stock_movements.reduce((sum:number,row:any)=>sum+row.qty_delta,0)).toBe(17);
  },180000);
});
