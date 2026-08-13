const { PrismaClient } = require("@prisma/client");
const { generateReferralCode } = require("../../utils/referralCode");

const prisma = new PrismaClient();


//----------------------------------------------------
// CREATE RETENTION STAGE
//----------------------------------------------------

async function createStage(parameters, req) {

    const {
        name,
        color,
        isFinal
    } = parameters;

    if (!name) {
        return {
            success: false,
            message: "Stage name is required."
        };
    }

    const existing =
        await prisma.referralPipeline.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: "insensitive"
                }
            }
        });

    if (existing) {
        return {
            success: false,
            message: `Retention stage '${name}' already exists.`
        };
    }

    const lastStage =
        await prisma.referralPipeline.findFirst({
            orderBy: {
                sequence: "desc"
            }
        });

    const nextSequence =
        lastStage
            ? lastStage.sequence + 1
            : 1;

    const stage =
        await prisma.referralPipeline.create({
            data: {
                name,
                color: color || "#3B82F6",
                isFinal: isFinal || false,
                sequence: nextSequence
            }
        });

    return {
        success: true,
        message:
            `Retention stage '${name}' created successfully.`,
        data: stage
    };
}


//----------------------------------------------------
// MOVE REFERRAL TO STAGE
//----------------------------------------------------

async function moveStage(parameters, req) {

    const {
        referral,
        stage
    } = parameters;

    if (!referral) {
        return {
            success: false,
            message: "Referral name is required."
        };
    }

    if (!stage) {
        return {
            success: false,
            message: "Stage name is required."
        };
    }

    const referralRecord =
        await prisma.referral.findFirst({
            where: {
                OR: [
                    {
                        referredLeadName: {
                            equals: referral,
                            mode: "insensitive"
                        }
                    },
                    {
                        referrerName: {
                            equals: referral,
                            mode: "insensitive"
                        }
                    },
                    {
                        referralCode: {
                            equals: referral,
                            mode: "insensitive"
                        }
                    }
                ]
            }
        });

    if (!referralRecord) {
        return {
            success: false,
            message: `Referral '${referral}' not found.`
        };
    }

    const stageRecord =
        await prisma.referralPipeline.findFirst({
            where: {
                name: {
                    equals: stage,
                    mode: "insensitive"
                }
            }
        });

    if (!stageRecord) {
        return {
            success: false,
            message:
                `Retention stage '${stage}' not found.`
        };
    }

    const updatedReferral =
        await prisma.referral.update({
            where: {
                id: referralRecord.id
            },
            data: {
                currentStageId: stageRecord.id
            },
            include: {
                currentStage: true
            }
        });

    await prisma.referralHistory.create({
        data: {
            referralId: referralRecord.id,
            stageId: stageRecord.id,
            changedBy: req?.user?.name || "System",
            remarks: "Stage Changed by AI"
        }
    });

    return {
        success: true,
        message:
            `Referral '${referralRecord.referredLeadName}' moved to '${stageRecord.name}'.`,
        data: updatedReferral
    };
}


//----------------------------------------------------
// SUBMIT REFERRAL
//----------------------------------------------------

async function submit(parameters, req) {

    const {
        referrer,
        referrerId,
        referrerName,
        referrerCompany,
        referredLeadName,
        referredCompany,
        referredEmail,
        referredPhone,
        rewardType,
        rewardValue
    } = parameters;


    //------------------------------------------------
    // Required fields
    //------------------------------------------------

    if (!referredLeadName) {
        return {
            success: false,
            message: "Referred person name is required."
        };
    }

    if (!referredCompany) {
        return {
            success: false,
            message: "Referred company is required."
        };
    }

    if (rewardValue === undefined || rewardValue === null || rewardValue === "") {
        return {
            success: false,
            message: "Reward value is required."
        };
    }


    //------------------------------------------------
    // Resolve referrer
    //------------------------------------------------

    let finalReferrerName = referrerName;
    let finalReferrerCompany = referrerCompany;
    let finalReferrerId = referrerId;

    /*
     * AI can say:
     *
     * "Submit referral from testing"
     *
     * In that case find the Won opportunity/customer.
     */

    if (referrer && !finalReferrerName) {

        const opportunity =
            await prisma.opportunity.findFirst({
                where: {
                    customerName: {
                        equals: referrer,
                        mode: "insensitive"
                    },
                    stage: {
                        equals: "Won",
                        mode: "insensitive"
                    }
                }
            });
        if (!opportunity) {

            return {
                success: false,
                message:
                    `Won customer '${referrer}' not found.`
            };

        }

        finalReferrerId = opportunity.id;
        finalReferrerName = opportunity.customerName;
        finalReferrerCompany = opportunity.company || "";
    }


    //------------------------------------------------
    // If explicit referrerName was provided
    //------------------------------------------------

    if (!finalReferrerName) {

        return {
            success: false,
            message:
                "Referrer name is required. Specify the won customer who is making the referral."
        };

    }


    //------------------------------------------------
    // Find first retention stage
    //------------------------------------------------

    let firstStage =
        await prisma.referralPipeline.findFirst({
            orderBy: {
                sequence: "asc"
            }
        });

    if (!firstStage) {

        firstStage =
            await prisma.referralPipeline.create({
                data: {
                    name: "New",
                    sequence: 1,
                    color: "#3B82F6",
                    isFinal: false
                }
            });

    }


    //------------------------------------------------
    // Create referral
    //------------------------------------------------

    const referral =
        await prisma.referral.create({

            data: {

                referralCode:
                    generateReferralCode(),

                referrerId:
                    finalReferrerId || null,

                referrerName:
                    finalReferrerName,

                referrerCompany:
                    finalReferrerCompany || "",

                referredLeadName,

                referredCompany,

                referredEmail:
                    referredEmail || null,

                referredPhone:
                    referredPhone || null,

                rewardType:
                    rewardType || "Credits",

                rewardValue:
                    Number(rewardValue),

                createdBy:
                    req?.user?.name || "System",

                createdById:
                    req?.user?.id || null,

                currentStage: {
                    connect: {
                        id: firstStage.id
                    }
                },

                referralHistories: {
                    create: {
                        stageId: firstStage.id,
                        changedBy:
                            req?.user?.name || "System",
                        remarks:
                            "Referral Created"
                    }
                }

            },

            include: {

                currentStage: true,

                referralHistories: true,

                referralRewards: true

            }

        });


    //------------------------------------------------
    // Response
    //------------------------------------------------

    return {

        success: true,

        message:
            `Referral for '${referredLeadName}' submitted successfully.`,

        data: referral

    };

}


module.exports = {

    createStage,

    moveStage,

    submit

};