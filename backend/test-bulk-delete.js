const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    // Let's create two mock opportunities first
    console.log("Creating mock opportunities...");
    const opp1 = await prisma.opportunity.create({
      data: {
        customerName: "Test Opp 1",
        dealValue: 100,
        stage: "New",
      }
    });
    const opp2 = await prisma.opportunity.create({
      data: {
        customerName: "Test Opp 2",
        dealValue: 200,
        stage: "New",
      }
    });
    console.log("Created:", opp1.id, opp2.id);

    // Now let's try deleteMany
    console.log("Deletemy with ids...");
    const result = await prisma.opportunity.deleteMany({
      where: {
        id: {
          in: [opp1.id, opp2.id]
        }
      }
    });
    console.log("Delete result:", result);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
