const { PrismaClient } = require("@prisma/client");
const { parseDate } = require("../utils/dateParser");

const prisma = new PrismaClient();

module.exports = {

    async schedule(params, req) {

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

        // If salesperson is not specified in parameters, assign it to the logged in user
        let assignedSalesperson = salesperson;
        if (!assignedSalesperson && req && req.user) {
            assignedSalesperson = req.user.name;
        }

        // Default the title if not provided by LLM
        let activityTitle = title;
        if (!activityTitle) {
            const leadName = lead;
            activityTitle = leadName 
                ? `Follow-up with ${leadName}` 
                : `${type || 'Follow-up'} Activity`;
        }

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

                title: activityTitle,

                type: type || "Task",

                date: parseDate(date),

                time: time || "10:00",

                duration: duration || 30,

                description,

                salesperson: assignedSalesperson,

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