const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

class UserResolverService {

    async resolve(assignee, currentUser = null) {

        if (!assignee) {
            return null;
        }

        //-----------------------------------
        // "me"
        //-----------------------------------

        if (assignee.toLowerCase() === "me") {
            return currentUser;
        }

        //-----------------------------------
        // Current user is required
        // for organization-level lookup
        //-----------------------------------

        if (!currentUser || !currentUser.organizationId) {
            return null;
        }

        //-----------------------------------
        // Search by Name
        // ONLY inside current organization
        //-----------------------------------

        const user = await prisma.user.findFirst({

            where: {

                name: {
                    equals: assignee,
                    mode: "insensitive"
                },

                organizationId: currentUser.organizationId

            }

        });

        return user;

    }

}

module.exports = new UserResolverService();