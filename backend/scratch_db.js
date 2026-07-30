require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.salesTeam.findMany({ select: { name: true } });
  const users = await prisma.user.findMany({ select: { name: true, role: true } });
  
  // Find leads matching actual categories
  const leads = await prisma.lead.findMany({ 
    select: { category: true, serviceType: true, assignedUser: true },
    take: 10
  });

  console.log(JSON.stringify({ teams, users, leads }, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
