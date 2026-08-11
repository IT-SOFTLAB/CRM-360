const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {

    const opportunity = await prisma.opportunity.findFirst({

        where: {

            customerName: {

                contains: "Rahul Sharma",

                mode: "insensitive"

            }

        }

    });

    console.log(opportunity);

    process.exit();

})();