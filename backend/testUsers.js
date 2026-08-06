const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function test() {

    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true
        }
    });

    console.table(users);

}

test();