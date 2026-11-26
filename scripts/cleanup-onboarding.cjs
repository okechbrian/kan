// Remove only the explicitly named, generated onboarding browser fixtures.
const { PrismaClient } = require('@prisma/client');
const emails = process.argv.slice(2);
if (!emails.length || emails.some(email => !/^onboarding-e2e-[a-f0-9]{32}-[ab]@example\.invalid$/.test(email))) {
  throw new Error('Refusing non-fixture cleanup');
}
const db = new PrismaClient();
(async () => {
  const accounts = await db.account.findMany({ where: { email: { in: emails } } });
  const ids = accounts.map(account => account.business_id);
  for (const id of ids) {
    const related = await db.account.findMany({ where: { business_id: id } });
    if (related.some(account => !emails.includes(account.email))) throw new Error('Refusing shared business cleanup');
    const business = await db.business.findUnique({ where: { id } });
    if (!business?.name.startsWith('Onboarding E2E ')) throw new Error('Refusing non-fixture business');
  }
  await db.$transaction(async tx => {
    await tx.auditEvent.deleteMany({ where: { business_id: { in: ids } } });
    await tx.notification.deleteMany({ where: { business_id: { in: ids } } });
    await tx.account.deleteMany({ where: { business_id: { in: ids } } });
    await tx.subscription.deleteMany({ where: { business_id: { in: ids } } });
    await tx.shop.deleteMany({ where: { business_id: { in: ids } } });
    await tx.business.deleteMany({ where: { id: { in: ids } } });
  }, { maxWait: 10000, timeout: 120000 });
  if (await db.account.count({ where: { email: { in: emails } } })) throw new Error('Fixture cleanup incomplete');
  process.stdout.write('Onboarding fixtures removed\n');
})().catch(error => { process.stderr.write(`Onboarding fixture cleanup failed (${error.code || error.name})\n`); process.exitCode = 1; })
  .finally(() => db.$disconnect());
