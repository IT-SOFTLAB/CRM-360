const { PrismaClient } = require("@prisma/client");
const { parseDate } = require("../utils/dateParser");
const AuthorizationService = require("../services/authorization.service");
const UserResolverService =
    require("../services/userResolver.service");

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

        //----------------------------------
        // Organization validation
        //----------------------------------

        if (!req?.user?.organizationId) {
            return {
                success: false,
                message: "Organization access is required."
            };
        }

        const organizationId = req.user.organizationId;
//----------------------------------
// Assigned salesperson
//----------------------------------

let assignedSalesperson;

// USER -> always assign to self
if (!AuthorizationService.isAdminLike(req.user)) {

    assignedSalesperson =
        req.user.name;

} else {

    // ADMIN / SUPER_ADMIN
    if (salesperson) {

        const resolvedUser =
            await UserResolverService.resolve(
                salesperson,
                req.user
            );

        if (!resolvedUser) {

            return {
                success: false,
                message:
                    `Salesperson '${salesperson}' not found.`
            };

        }

        assignedSalesperson =
            resolvedUser.name;

    } else {

        // Default to logged-in user
        assignedSalesperson =
            req.user.name;

    }

}
        //----------------------------------
        // Default activity title
        //----------------------------------

        let activityTitle = title;

        if (!activityTitle) {

            activityTitle = lead
                ? `Follow-up with ${lead}`
                : `${type || "Follow-up"} Activity`;

        }

        //----------------------------------
        // Find Lead
        //----------------------------------

        let leadRecord = null;

        if (lead) {

            const leadWhere = {

                contactName: {
                    equals: lead,
                    mode: "insensitive"
                },

                organizationId

            };

            //----------------------------------
            // Apply role / ownership restrictions
            //----------------------------------

            Object.assign(
                leadWhere,
                AuthorizationService.leadFilter(req.user)
            );

            leadRecord = await prisma.lead.findFirst({

                where: leadWhere

            });

            if (!leadRecord) {

                return {
                    success: false,
                    message: `Lead "${lead}" not found or you do not have access.`
                };

            }

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

                duration: Number(duration) || 30,

                description: description || null,

                salesperson: assignedSalesperson,

                leadId: leadRecord?.id || null,

                organizationId

            }

        });

        return {

            success: true,

            message: "Activity scheduled successfully.",

            data: activity

        };

    }

};