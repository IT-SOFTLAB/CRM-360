const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/* Generate Referral Code */
const generateReferralCode = async () => {
  const count = await prisma.referral.count();

  return `CRM-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
};

/* Create Referral */

exports.createReferral = async (req, res) => {

  try {

    const {

      referrerId,

      referrerName,

      referrerCompany,

      referredLeadName,

      referredCompany,

      referredEmail,

      referredPhone,

      rewardType,

      rewardValue

    } = req.body;

    const firstStage = await prisma.referralPipeline.findFirst({

      orderBy: {

        sequence: "asc"

      }

    });

    if (!firstStage) {

      return res.status(400).json({

        message: "Referral Pipeline not configured."

      });

    }

    const code = await generateReferralCode();

    const referral = await prisma.referral.create({

      data: {

        referralCode: code,

        referrerId,

        referrerName,

        referrerCompany,

        referredLeadName,

        referredCompany,

        referredEmail,

        referredPhone,

        rewardType,

        rewardValue: Number(rewardValue),

        currentStageId: firstStage.id

      },

      include: {

        currentStage: true

      }

    });


    await prisma.referralReward.create({

    data:{

        referralId: referral.id,

        amount: Number(rewardValue),

        rewardType

    }

});
    await prisma.referralHistory.create({

      data: {

        referralId: referral.id,

        stageId: firstStage.id,

        changedBy: referrerName,

        remarks: "Referral Submitted"

      }

    });

    res.status(201).json({

      success: true,

      referral

    });

  }

  catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

};

/* Get All Referrals */

exports.getReferrals = async (req, res) => {

    try {

        const referrals = await prisma.referral.findMany({

            include: {

                currentStage: true,

            rewards: true,

                histories : {

                    include: {

                        pipeline: true

                    },

                    orderBy: {

                        createdAt: "asc"

                    }

                }

            },

            orderBy: {

                createdAt: "desc"

            }

        });

        res.json(referrals);

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

/* Get Single Referral */

exports.getReferral = async (req, res) => {

  try {

    const referral = await prisma.referral.findUnique({

      where: {

        id: req.params.id

      },

     include: {

    currentStage: true,

    rewards : true,

    histories : {

        include: {

            pipeline: true

        },

        orderBy: {

            createdAt: "asc"

        }

    }

}

    });

    if (!referral) {

      return res.status(404).json({

        message: "Referral not found"

      });

    }

    res.json(referral);

  }

  catch (err) {

    res.status(500).json({

      message: err.message

    });

  }

};

/* Update Referral */

exports.updateReferral = async (req, res) => {

  try {

    const referral = await prisma.referral.update({

      where: {

        id: req.params.id

      },

      data: req.body,

      include: {

        currentStage: true

      }

    });

    res.json(referral);

  }

  catch (err) {

    res.status(500).json({

      message: err.message

    });

  }

};

/* Delete Referral */

exports.deleteReferral = async (req, res) => {

  try {

    await prisma.referralReward.deleteMany({

      where: {

        referralId: req.params.id

      }

    });

    await prisma.referralHistory.deleteMany({

      where: {

        referralId: req.params.id

      }

    });

    await prisma.referral.delete({

      where: {

        id: req.params.id

      }

    });

    res.json({

      message: "Referral Deleted Successfully"

    });

  }

  catch (err) {

    res.status(500).json({

      message: err.message

    });

  }

};

/*
===========================================
REFERRAL DASHBOARD
===========================================
*/

exports.dashboard = async (req, res) => {

    try {

        const totalReferrals = await prisma.referral.count();

       const qualifiedLeads = await prisma.referral.count({
  where: {
    currentStage: {
      isFinal: true
    }
  }
});

        const conversions = await prisma.referral.count({

            where: {

                currentStage: {

                    isFinal: true

                }

            }

        });

        const rewards = await prisma.referralReward.findMany({

            where: {

                paid: true

            }

        });

        const totalRewardsPaid = rewards.reduce(

            (sum, reward) => sum + reward.amount,

            0

        );

        const pendingRewards = await prisma.referralReward.findMany({

            where: {

                paid: false

            }

        });

        const pendingRewardAmount = pendingRewards.reduce(

            (sum, reward) => sum + reward.amount,

            0

        );

        res.json({

            totalReferrals,

            qualifiedLeads,

            conversions,

            totalRewardsPaid,

            pendingRewardAmount

        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

/*
===========================================
MOVE REFERRAL
===========================================
*/

exports.moveReferral = async (req, res) => {

    try {

        const { stageId, remarks, changedBy } = req.body;

        const referral = await prisma.referral.findUnique({

            where: {
                id: req.params.id
            },

            include: {
                currentStage: true
            }

        });

        if (!referral) {

            return res.status(404).json({

                success: false,

                message: "Referral not found"

            });

        }

        const stage = await prisma.referralPipeline.findUnique({

            where: {
                id: stageId
            }

        });

        if (!stage) {

            return res.status(404).json({

                success: false,

                message: "Pipeline stage not found"

            });

        }

        await prisma.$transaction(async (tx) => {

            await tx.referral.update({

                where: {

                    id: referral.id

                },

                data: {

                    currentStageId: stage.id

                }

            });

            await tx.referralHistory.create({

                data: {

                    referralId: referral.id,

                    stageId: stage.id,

                    changedBy: changedBy || "System",

                    remarks: remarks || `Moved to ${stage.name}`

                }

            });

            if (stage.isFinal) {

                await tx.referralReward.updateMany({

                    where: {

                        referralId: referral.id

                    },

                    data: {

                        approved: true,

                        approvedBy: changedBy || "System"

                    }

                });

            }

        });

        const updatedReferral = await prisma.referral.findUnique({

            where: {

                id: referral.id

            },

            include: {

                currentStage: true,

                 rewards : true,

                histories : {

                    include: {

                        pipeline: true

                    },

                    orderBy: {

                        createdAt: "asc"

                    }

                }

            }

        });

        res.json({

            success: true,

            message: "Referral moved successfully",

            referral: updatedReferral

        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            success: false,

            message: error.message

        });

    }
  };

  /*
==========================================
REFERRAL HISTORY
==========================================
*/

exports.getHistory = async (req, res) => {

    try {

        const history = await prisma.referralHistory.findMany({

            where: {

                referralId: req.params.id

            },

            include: {

                pipeline: true

            },

            orderBy: {

                createdAt: "asc"

            }

        });

        res.json({

            success: true,

            total: history.length,

            history

        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

/*
==========================================
GET REFERRAL REWARD
==========================================
*/

exports.getReward = async (req, res) => {

    try {

        const reward = await prisma.referralReward.findFirst({

            where: {

                referralId: req.params.id

            }

        });

        if (!reward) {

            return res.status(404).json({

                success: false,

                message: "Reward not found"

            });

        }

        res.json({

            success: true,

            reward

        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

/*
====================================
REFERRAL DETAILS
====================================
*/

exports.getReferralDetails = async (req, res) => {

    try {

        const referral = await prisma.referral.findUnique({

            where: {

                id: req.params.id

            },

            include: {

                currentStage: true,

                rewards : true,

                histories : {

                    include: {

                        pipeline: true

                    },

                    orderBy: {

                        createdAt: "asc"

                    }

                }

            }

        });

        if (!referral) {

            return res.status(404).json({

                success: false,

                message: "Referral not found"

            });

        }

        res.json({

            success: true,

            referral

        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

/*
====================================
REFERRAL ANALYTICS
====================================
*/

exports.analytics = async (req, res) => {

    try {

        const referrals = await prisma.referral.findMany({
            include: {
                rewards : true
            }
        });

        const monthly = {};

        referrals.forEach(ref => {

            const month = ref.createdAt.toLocaleString("default", {
                month: "short"
            });

            if (!monthly[month]) {

                monthly[month] = {

                    referrals: 0,

                    rewards: 0

                };

            }

            monthly[month].referrals++;

            monthly[month].rewards +=
                ref.rewards.reduce(
                    (sum, reward) => sum + reward.amount,
                    0
                );

        });

        const conversionRate =
            referrals.length === 0
                ? 0
                : (
                    referrals.filter(
                        r => r.currentStageId
                    ).length /
                    referrals.length
                ) * 100;

        res.json({

            success: true,

            monthly,

            conversionRate

        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};