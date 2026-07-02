const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/*
---------------------------------------
GET ALL PIPELINE STAGES
---------------------------------------
*/

exports.getPipeline = async (req, res) => {

    try {

        const stages = await prisma.referralPipeline.findMany({

            orderBy: {

                sequence: "asc"

            },

            include: {

                _count: {

                    select: {

                        referrals: true

                    }

                }

            }

        });

        const pipeline = stages.map(stage => ({

            ...stage,

            totalReferrals: stage._count.referrals

        }));

        res.json({

            success: true,

            pipeline

        });

    }

    catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

};
/*
---------------------------------------
CREATE NEW PIPELINE STAGE
---------------------------------------
*/

exports.createStage = async (req, res) => {

    try {

        const {

            name,

            color,

            isFinal

        } = req.body;

        const totalStages = await prisma.referralPipeline.count();

        const stage = await prisma.referralPipeline.create({

            data: {

                name,

                color,

                isFinal,

                sequence: totalStages + 1

            }

        });

        res.status(201).json({

            success: true,

            stage

        });

    }

    catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

/*
---------------------------------------
UPDATE STAGE
---------------------------------------
*/

exports.updateStage = async (req, res) => {

    try {

        const {

            name,

            color,

            isFinal

        } = req.body;

        const stage = await prisma.referralPipeline.update({

            where: {

                id: req.params.id

            },

            data: {

                name,

                color,

                isFinal

            }

        });

        res.json({

            success: true,

            stage

        });

    }

    catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

/*
---------------------------------------
DELETE STAGE
---------------------------------------
*/

exports.deleteStage = async (req, res) => {

    try {

        await prisma.referralPipeline.delete({

            where: {

                id: req.params.id

            }

        });

        res.json({

            success: true,

            message: "Pipeline Stage Deleted"

        });

    }

    catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

/*
---------------------------------------
MOVE REFERRAL TO NEXT STAGE
---------------------------------------
*/

exports.moveReferral = async (req, res) => {

    try {

        const {

            stageId,

            changedBy,

            remarks

        } = req.body;

        const referral = await prisma.referral.update({

            where: {

                id: req.params.id

            },

            data: {

                currentStageId: stageId

            },

            include: {

                currentStage: true

            }

        });

        await prisma.referralHistory.create({

            data: {

                referralId: referral.id,

                stageId,

                changedBy,

                remarks

            }

        });

        res.json({

            success: true,

            referral

        });

    }

    catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

/*
---------------------------------------
PIPELINE DASHBOARD
---------------------------------------
*/

exports.dashboard = async (req, res) => {

    try {

        const totalReferrals = await prisma.referral.count();

        const approvedRewards = await prisma.referralReward.count({

            where: {

                approved: true

            }

        });

        const paidRewards = await prisma.referralReward.aggregate({

            _sum: {

                amount: true

            },

            where: {

                paid: true

            }

        });

        const stageSummary = await prisma.referralPipeline.findMany({

            include: {

                _count: {

                    select: {

                        referrals: true

                    }

                }

            },

            orderBy: {

                sequence: "asc"

            }

        });

        res.json({

            totalReferrals,

            approvedRewards,

            totalRewardPaid: paidRewards._sum.amount || 0,

            stageSummary

        });

    }

    catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

/*
====================================
REORDER PIPELINE STAGE
====================================
*/

exports.reorderStage = async (req, res) => {

    try {

        const { direction } = req.body;

        const stage = await prisma.referralPipeline.findUnique({

            where: {

                id: req.params.id

            }

        });

        if (!stage) {

            return res.status(404).json({

                success: false,

                message: "Stage not found"

            });

        }

        let swapStage = null;

        if (direction === "left") {

            swapStage = await prisma.referralPipeline.findFirst({

                where: {

                    sequence: stage.sequence - 1

                }

            });

        } else {

            swapStage = await prisma.referralPipeline.findFirst({

                where: {

                    sequence: stage.sequence + 1

                }

            });

        }

        if (!swapStage) {

            return res.json({

                success: true,

                message: "Nothing to reorder"

            });

        }

        await prisma.$transaction([

            prisma.referralPipeline.update({

                where: {

                    id: stage.id

                },

                data: {

                    sequence: swapStage.sequence

                }

            }),

            prisma.referralPipeline.update({

                where: {

                    id: swapStage.id

                },

                data: {

                    sequence: stage.sequence

                }

            })

        ]);

        res.json({

            success: true,

            message: "Pipeline reordered"

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
=========================================
RENAME PIPELINE STAGE
=========================================
*/

exports.renameStage = async (req, res) => {

    try {

        const { name } = req.body;

        if (!name || name.trim() === "") {

            return res.status(400).json({

                success: false,

                message: "Stage name is required"

            });

        }

        const stage = await prisma.referralPipeline.update({

            where: {

                id: req.params.id

            },

            data: {

                name: name.trim()

            }

        });

        res.json({

            success: true,

            message: "Stage renamed successfully",

            stage

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
=========================================
SET FINAL PIPELINE STAGE
=========================================
*/

exports.setFinalStage = async (req, res) => {

    try {

        const stage = await prisma.referralPipeline.findUnique({

            where: {

                id: req.params.id

            }

        });

        if (!stage) {

            return res.status(404).json({

                success: false,

                message: "Stage not found"

            });

        }

        await prisma.$transaction([

            prisma.referralPipeline.updateMany({

                data: {

                    isFinal: false

                }

            }),

            prisma.referralPipeline.update({

                where: {

                    id: stage.id

                },

                data: {

                    isFinal: true

                }

            })

        ]);

        res.json({

            success: true,

            message: `${stage.name} is now the Final Stage`

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
=========================================
PIPELINE STAGE STATISTICS
=========================================
*/

exports.getPipelineStats = async (req, res) => {

    try {

        const stages = await prisma.referralPipeline.findMany({

            orderBy: {

                sequence: "asc"

            }

        });

        const data = await Promise.all(

            stages.map(async (stage) => {

                const total = await prisma.referral.count({

                    where: {

                        currentStageId: stage.id

                    }

                });

                return {

                    id: stage.id,

                    name: stage.name,

                    sequence: stage.sequence,

                    color: stage.color,

                    isFinal: stage.isFinal,

                    totalReferrals: total

                };

            })

        );

        res.json({

            success: true,

            totalStages: data.length,

            pipeline: data

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