
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = {

    async moveStage({ lead, stage }) {

        const opportunity = await prisma.opportunity.findFirst({

            where:{

                customerName:{

                    equals:lead,

                    mode:"insensitive"

                }

            }

        });

        if(!opportunity){

            return{

                success:false,

                message:"Opportunity not found."

            }

        }

        const updated = await prisma.opportunity.update({

            where:{

                id:opportunity.id

            },

            data:{

                stage

            }

        });

        if(updated.leadId){

            await prisma.lead.update({

                where:{

                    id:updated.leadId

                },

                data:{

                    status:stage

                }

            });

        }

        return{

            success:true,

            message:`${lead} moved to ${stage}.`,

            data:updated

        };

    }

};