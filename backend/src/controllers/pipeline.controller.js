const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * GET ALL PIPELINE STAGES
 */
exports.getStages = async (req, res) => {
  try {

    let stages = await prisma.referralPipeline.findMany({
      orderBy: {
        sequence: "asc",
      },
      include: {
        _count: {
          select: {
            referrals: true,
          },
        },
      },
    });

    // Create default stage if none exists
    if (stages.length === 0) {

      await prisma.referralPipeline.create({
        data: {
          name: "New",
          sequence: 1,
          color: "#3B82F6",
          isFinal: false,
        },
      });

      stages = await prisma.referralPipeline.findMany({
        orderBy: {
          sequence: "asc",
        },
        include: {
          _count: {
            select: {
              referrals: true,
            },
          },
        },
      });

    }

    res.json(stages);

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }
};

/**
 * CREATE NEW STAGE
 */
exports.createStage = async (req, res) => {
  try {
    const { name, color, isFinal } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Stage name is required",
      });
    }

    const existing = await prisma.referralPipeline.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      return res.status(400).json({
        message: "Stage already exists",
      });
    }

   const lastStage = await prisma.referralPipeline.findFirst({
    orderBy:{
        sequence:"desc"
    }
});

const nextSequence = lastStage
    ? lastStage.sequence + 1
    : 1;

    const stage = await prisma.referralPipeline.create({
      data: {
        name,
        color: color || "#3B82F6",
        isFinal: isFinal || false,
       sequence: nextSequence,
      },
    });

    res.status(201).json(stage);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/**
 * DELETE STAGE
 */
exports.deleteStage = async (req, res) => {
  try {
    const { id } = req.params;

    const stage = await prisma.referralPipeline.findUnique({
      where: {
        id,
      },
      include: {
        referrals: true,
      },
    });

    if (!stage) {
      return res.status(404).json({
        message: "Stage not found",
      });
    }

    const mandatory = ['new', 'won', 'lost'];
    if (mandatory.includes((stage.name || '').trim().toLowerCase())) {
      return res.status(400).json({
        message: `System stage "${stage.name}" is mandatory and cannot be deleted.`,
      });
    }

  const count = await prisma.referralPipeline.count();

if (count === 1) {

    return res.status(400).json({

        message: "At least one stage is required."

    });

}

    if (stage.referrals.length > 0) {
      return res.status(400).json({
        message:
          "Cannot delete stage because referrals exist. Move referrals first.",
      });
    }

    await prisma.referralPipeline.delete({
      where: {
        id,
      },
    });

    res.json({
      message: "Stage deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/**
 * REORDER STAGES
 */
exports.reorderStages = async (req, res) => {
  try {
    const stagesList = Array.isArray(req.body) ? req.body : (req.body && req.body.stages);
    if (stagesList && Array.isArray(stagesList)) {
      await prisma.$transaction(
        stagesList.map((stage, index) =>
          prisma.referralPipeline.update({
            where: {
              id: stage.id,
            },
            data: {
              sequence: stage.sequence !== undefined ? Number(stage.sequence) : (stage.order !== undefined ? Number(stage.order) : index + 1),
            },
          })
        )
      );
    }

    const updatedStages = await prisma.referralPipeline.findMany({
      orderBy: {
        sequence: "asc",
      },
      include: {
        _count: {
          select: {
            referrals: true,
          },
        },
      },
    });

    res.json(updatedStages);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};