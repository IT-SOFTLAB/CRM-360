const { PrismaClient } = require("@prisma/client");
const { parseDate } = require("../utils/dateParser");

const prisma = new PrismaClient();

module.exports = {

    async schedule(params) {

        const {

            title,
            type,
            date,
            time,
            duration,
            description,
            lead,
            salesperson

        } = params;

        //----------------------------------
        // Find Lead (optional)
        //----------------------------------

        let leadRecord = null;

        if (lead) {

            leadRecord = await prisma.lead.findFirst({

                where: {

                    contactName: {

                        equals: lead,
                        mode: "insensitive"

                    }

                }

            });

        }

        //----------------------------------
        // Create Activity
        //----------------------------------

        const activity = await prisma.activity.create({

            data: {

                title,

                type: type || "Task",

                date: parseDate(date),

                time: time || "10:00",

                duration: duration || 30,

                description,

                salesperson,

                leadId: leadRecord?.id

            }

        });

        return {

            success: true,

            message: "Activity scheduled successfully.",

            data: activity

        };

    }

};