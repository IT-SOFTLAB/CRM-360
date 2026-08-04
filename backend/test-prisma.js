const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log("Fetching opportunities count...");
    const count = await prisma.opportunity.count();
    console.log("Total opportunities:", count);
    
    console.log("Fetching first 5 opportunities...");
    const opps = await prisma.opportunity.findMany({ take: 5 });
    console.log("Opps:", opps.map(o => ({ id: o.id, customerName: o.customerName })));
  } catch (err) {
    console.error("Prisma error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
