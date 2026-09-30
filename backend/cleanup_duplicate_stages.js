const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupDuplicateStages() {
  console.log('Starting pipeline stage deduplication...');
  try {
    const allStages = await prisma.pipelineStage.findMany({
      orderBy: { createdAt: 'asc' }
    });

    // Group stages by organizationId and lowercased trimmed name
    const grouped = {};
    for (const stage of allStages) {
      const orgId = stage.organizationId || 'orgA';
      const cleanName = (stage.name || '').trim().toLowerCase();
      const key = `${orgId}:::${cleanName}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(stage);
    }

    let deletedCount = 0;
    let remappedOppsCount = 0;

    for (const [key, stages] of Object.entries(grouped)) {
      if (stages.length > 1) {
        // Keep the first stage (oldest / primary)
        const primary = stages[0];
        const duplicates = stages.slice(1);
        const duplicateIds = duplicates.map(d => d.id);
        const duplicateNames = duplicates.map(d => d.name);

        console.log(`Found ${duplicates.length} duplicate stage(s) for key "${key}". Keeping primary stage ID: ${primary.id} ("${primary.name}")`);

        // Remap opportunities pointing to duplicate stageIds
        const updateResult = await prisma.opportunity.updateMany({
          where: {
            stageId: { in: duplicateIds }
          },
          data: {
            stageId: primary.id,
            stage: primary.name
          }
        });

        // Remap opportunities matching duplicate names if stageId was null
        await prisma.opportunity.updateMany({
          where: {
            organizationId: primary.organizationId,
            stage: { in: duplicateNames }
          },
          data: {
            stageId: primary.id,
            stage: primary.name
          }
        });

        remappedOppsCount += updateResult.count;

        // Safely delete duplicate stages
        const deleteResult = await prisma.pipelineStage.deleteMany({
          where: {
            id: { in: duplicateIds }
          }
        });

        deletedCount += deleteResult.count;
      }
    }

    console.log(`\nCleanup Complete!`);
    console.log(`- Remapped Opportunities: ${remappedOppsCount}`);
    console.log(`- Deleted Duplicate Stages: ${deletedCount}\n`);
  } catch (error) {
    console.error('Error during stage cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicateStages();
