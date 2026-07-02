const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/*
===========================================
GET ALL REWARDS
===========================================
*/

exports.getRewards = async (req, res) => {

    try {

        const rewards = await prisma.referralReward.findMany({

            include: {

                referral: {

                    include: {

                        currentStage: true

                    }

                }

            },

            orderBy: {

                id: "desc"

            }

        });

        res.json(rewards);

    }

    catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

/*
===========================================
APPROVE REWARD
===========================================
*/

exports.approveReward = async (req, res) => {

    try {

        const { approvedBy } = req.body;

        const reward = await prisma.referralReward.update({

            where: {

                id: req.params.id

            },

            data: {

                approved: true,

                approvedBy

            },

            include: {

                referral: true

            }

        });

        await prisma.referral.update({

            where: {

                id: reward.referralId

            },

            data: {

                rewardApproved: true

            }

        });

        res.json({

            success: true,

            message: "Reward Approved Successfully",

            reward

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
===========================================
REJECT REWARD
===========================================
*/

exports.rejectReward = async (req, res) => {

    try {

        const reward = await prisma.referralReward.update({

            where: {

                id: req.params.id

            },

            data: {

                approved: false,

                approvedBy: null

            }

        });

        await prisma.referral.update({

            where: {

                id: reward.referralId

            },

            data: {

                rewardApproved: false

            }

        });

        res.json({

            success: true,

            message: "Reward Rejected"

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
===========================================
MARK AS PAID
===========================================
*/

exports.markRewardPaid = async (req, res) => {

    try {

        const reward = await prisma.referralReward.update({

            where: {

                id: req.params.id

            },

            data: {

                paid: true,

                paidDate: new Date()

            },

            include: {

                referral: true

            }

        });

        res.json({

            success: true,

            message: "Reward Paid Successfully",

            reward

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
===========================================
REWARD HISTORY
===========================================
*/

exports.rewardHistory = async (req, res) => {

    try {

        const reward = await prisma.referralReward.findUnique({

            where: {

                id: req.params.id

            },

            include: {

                referral: {

                    include: {

                        histories: {

                            include: {

                                pipeline: true

                            },

                            orderBy: {

                                createdAt: "asc"

                            }

                        }

                    }

                }

            }

        });

        if (!reward) {

            return res.status(404).json({

                message: "Reward not found"

            });

        }

        res.json(reward);

    }

    catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

/*
===========================================
REWARD DASHBOARD
===========================================
*/

exports.dashboard = async (req, res) => {

    try {

        const totalRewards = await prisma.referralReward.count();

        const approvedRewards = await prisma.referralReward.count({

            where: {

                approved: true

            }

        });

        const pendingRewards = await prisma.referralReward.count({

            where: {

                approved: false

            }

        });

        const paidRewards = await prisma.referralReward.count({

            where: {

                paid: true

            }

        });

        const totalPaidAmount = await prisma.referralReward.aggregate({

            _sum: {

                amount: true

            },

            where: {

                paid: true

            }

        });

        const pendingAmount = await prisma.referralReward.aggregate({

            _sum: {

                amount: true

            },

            where: {

                paid: false

            }

        });

        res.json({

            totalRewards,

            approvedRewards,

            pendingRewards,

            paidRewards,

            totalPaidAmount: totalPaidAmount._sum.amount || 0,

            pendingAmount: pendingAmount._sum.amount || 0

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
=====================================
PAY REWARD
=====================================
*/

exports.payReward = async (req, res) => {

    try {

        const reward = await prisma.referralReward.findUnique({

            where: {

                id: req.params.id

            }

        });

        if (!reward) {

            return res.status(404).json({

                success: false,

                message: "Reward not found"

            });

        }

        if (!reward.approved) {

            return res.status(400).json({

                success: false,

                message: "Reward must be approved before payment."

            });

        }

        if (reward.paid) {

            return res.status(400).json({

                success: false,

                message: "Reward already paid."

            });

        }

        const updatedReward = await prisma.referralReward.update({

            where: {

                id: reward.id

            },

            data: {

                paid: true,

                paidDate: new Date()

            }

        });

        res.json({

            success: true,

            message: "Reward paid successfully.",

            reward: updatedReward

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