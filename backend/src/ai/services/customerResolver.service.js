const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

class CustomerResolver {

    async resolve(name) {

        return await prisma.customer.findFirst({

            where: {

                customerName: {

                    equals: name,

                    mode: "insensitive"

                }

            }

        });

    }

}

module.exports = new CustomerResolver();