const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { generateReferralCode } = require("../utils/referralCode");

exports.getDashboard = async (req, res) => {
  try {
    const user = req.user;
    const userRole = (user?.role || 'USER').toUpperCase().replace(/[\s_]+/g, '_');
    
    let whereClause = {};
    let rewardWhereClause = {};
    if (userRole === 'USER') {
      whereClause = {
        OR: [
          { createdById: user.id },
          { createdBy: user.name }
        ]
      };
      rewardWhereClause = {
        referral: {
          OR: [
            { createdById: user.id },
            { createdBy: user.name }
          ]
        }
      };
    }

    const totalReferrals = await prisma.referral.count({
      where: whereClause
    });

    const qualifiedLeads = await prisma.referral.count({
      where: {
        ...whereClause,
        currentStage: {
          isFinal: false,
        },
      },
    });

    const conversions = await prisma.referral.count({
      where: {
        ...whereClause,
        currentStage: {
          isFinal: true,
        },
      },
    });

    const paidRewards = await prisma.referralReward.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        ...rewardWhereClause,
        paid: true,
      },
    });

    const pendingRewards = await prisma.referralReward.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        ...rewardWhereClause,
        paid: false,
      },
    });

    res.json({
      totalReferrals,
      qualifiedLeads,
      conversions,
      totalRewardsPaid: paidRewards._sum.amount || 0,
      pendingRewardAmount: pendingRewards._sum.amount || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createReferral = async(req,res)=>{
    try{
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

      let firstStage = await prisma.referralPipeline.findFirst({
        orderBy: {
            sequence: "asc"
        }
      });

      if (!firstStage) {
          firstStage = await prisma.referralPipeline.create({
              data: {
                  name: "New",
                  sequence: 1,
                  color: "#3B82F6",
                  isFinal: false
              }
          });
      }

      const referral = await prisma.referral.create({
          data:{
              referralCode:generateReferralCode(),
              referrerId,
              referrerName,
              referrerCompany,
              referredLeadName,
              referredCompany,
              referredEmail,
              referredPhone,
              rewardType,
              rewardValue:Number(rewardValue),
              createdBy: req.user?.name || "System",
              createdById: req.user?.id || null,
              currentStage: {
                connect: {
                  id: firstStage.id,
                },
              },
              referralHistories: {
                create: {
                  stageId: firstStage.id,
                  changedBy: req.user?.name || "System",
                  remarks: "Referral Created"
                }
              }
          },
          include:{
              currentStage:true,
              referralHistories:true,
              referralRewards:true
          }
      });

      res.status(201).json(referral);

    }catch(err){
        console.log(err);
        res.status(500).json({message:err.message});
    }
} 

exports.getAllReferrals = async(req,res)=>{
    try{
        const user = req.user;
        const userRole = (user?.role || 'USER').toUpperCase().replace(/[\s_]+/g, '_');
        
        let whereClause = {};
        if (userRole === 'USER') {
          whereClause = {
            OR: [
              { createdById: user.id },
              { createdBy: user.name }
            ]
          };
        }

        const referrals = await prisma.referral.findMany({
            where: whereClause,
            include:{
                currentStage:true,
                referralRewards:true,
                referralHistories:{
                    include:{
                        pipeline:true
                    }
                }
            },
            orderBy:{
                createdAt:"desc"
            }
        });

        res.json(referrals);
    }catch(err){
        res.status(500).json({
            message:err.message
        });
    }
} 

exports.getReferral = async(req,res)=>{
    try{
        const referral = await prisma.referral.findUnique({
            where:{
                id:req.params.id
            },
            include:{
                currentStage:true,
                referralRewards:true,
                referralHistories:{
                    include:{
                        pipeline:true
                    }
                }
            }
        });

        if(!referral)
            return res.status(404).json({message:"Referral not found"});

        const user = req.user;
        const userRole = (user?.role || 'USER').toUpperCase().replace(/[\s_]+/g, '_');
        if (userRole === 'USER' && referral.createdById !== user.id && referral.createdBy !== user.name) {
            return res.status(403).json({message:"Access denied to this referral record"});
        }

        res.json(referral);
    }catch(err){
        res.status(500).json({message:err.message});

    }

} 

exports.updateReferral = async(req,res)=>{

    try{

        const referral = await prisma.referral.update({

            where:{
                id:req.params.id
            },

            data:req.body,

            include:{
                currentStage:true
            }

        });

        res.json(referral);

    }catch(err){

        res.status(500).json({message:err.message});

    }

} 

exports.deleteReferral = async(req,res)=>{

    try{

        await prisma.referralHistory.deleteMany({

            where:{
                referralId:req.params.id
            }

        });

        await prisma.referralReward.deleteMany({

            where:{
                referralId:req.params.id
            }

        });

        await prisma.referral.delete({

            where:{
                id:req.params.id
            }

        });

        res.json({
            message:"Referral deleted"
        });

    }catch(err){

        res.status(500).json({
            message:err.message
        });

    }

} 

exports.changeStage = async (req, res) => {
  try {
    const { stageId } = req.body;
    const { id } = req.params;

    // Check stage exists
    const stage = await prisma.referralPipeline.findUnique({
      where: {
        id: stageId,
      },
    });

    if (!stage) {
      return res.status(404).json({
        message: "Pipeline stage not found",
      });
    }

    // Update referral
    const referral = await prisma.referral.update({
      where: {
        id,
      },
      data: {
        currentStageId: stageId,
      },
      include: {
        currentStage: true,
      },
    });

    // Add history
    await prisma.referralHistory.create({
      data: {
        referralId: id,
        stageId,
        changedBy: "System", // Replace with req.user.id after auth is enabled
        remarks: "Stage Changed",
      },
    });

    res.json(referral);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
};

exports.approveReward = async(req,res)=>{

    try{

        const referral = await prisma.referral.update({

            where:{
                id:req.params.id
            },

            data:{
                rewardApproved:true
            }

        });

const reward = await prisma.referralReward.findFirst({
    where: {
        referralId: req.params.id
    }
});

if (reward) {
    return res.status(400).json({
        message: "Reward already approved"
    });
}

        await prisma.referralReward.create({

            data:{

                referralId:req.params.id,

                amount:referral.rewardValue,

                rewardType:referral.rewardType,

                approved:true,

              approvedBy: "System"

            }

        });

        res.json({
            message:"Reward Approved"
        });

    }catch(err){

        res.status(500).json({
            message:err.message
        });

    }

} 

