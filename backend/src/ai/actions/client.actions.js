const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function search(parameters, req) {

    const {
        minDealValue,
        maxDealValue,
        sortBy,
        sortOrder,
        limit
    } = parameters;

    const where = {};

    //------------------------------------
    // Deal value filters
    //------------------------------------

    if (minDealValue !== null && minDealValue !== undefined) {

        where.dealValue = {
            gte: Number(minDealValue)
        };

    }

    if (maxDealValue !== null && maxDealValue !== undefined) {

        where.dealValue = {
            ...(where.dealValue || {}),
            lte: Number(maxDealValue)
        };

    }

    //------------------------------------
    // User authorization
    //------------------------------------

    const role =
        (req?.user?.role || "")
            .toUpperCase()
            .replace(/[\s_]+/g, "_");

    if (role === "USER") {

        where.assignedSalesperson =
            req.user.name;

    }

    //------------------------------------
    // Sorting
    //------------------------------------

    let orderBy = {
        createdAt: "desc"
    };

    if (sortBy === "dealValue") {

        orderBy = {
            dealValue:
                sortOrder === "asc"
                    ? "asc"
                    : "desc"
        };

    }

    //------------------------------------
    // Query customers
    //------------------------------------

    let query = {

        where,

        orderBy

    };

    if (
        limit !== null &&
        limit !== undefined
    ) {

        query.take = Number(limit);

    }

    const customers =
        await prisma.customer.findMany(query);

    return {

        success: true,

        count: customers.length,

        data: customers,

        message:
            `${customers.length} client(s) found.`

    };

}

module.exports = {

    search

};