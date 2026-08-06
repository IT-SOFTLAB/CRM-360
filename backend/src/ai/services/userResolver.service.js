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

        if (

            assignee.toLowerCase() === "me"

        ) {

            return currentUser;

        }

        //-----------------------------------
        // Search by Name
        //-----------------------------------

        const user = await prisma.user.findFirst({

            where: {

                name: {

                    equals: assignee,

                    mode: "insensitive"

                }

            }

        });

        return user;

    }

}

module.exports = new UserResolverService();