const { PrismaClient } = require("@prisma/client");
const AuthorizationService =
    require("../services/authorization.service");

const prisma = new PrismaClient();

async function search(parameters, req) {

    const {
        minDealValue,
        maxDealValue,
        sortBy,
        sortOrder,
        limit
    } = parameters;

    //------------------------------------
    // Organization validation
    //------------------------------------

    if (!req?.user?.organizationId) {

        return {
            success: false,
            message: "Organization access is required."
        };

    }

    //------------------------------------
    // Authorization filter
    //------------------------------------

    const where = {
        ...AuthorizationService.customerFilter(
            req.user
        )
    };

    //------------------------------------
    // Deal value filters
    //------------------------------------

    if (
        minDealValue !== null &&
        minDealValue !== undefined
    ) {

        where.dealValue = {
            gte: Number(minDealValue)
        };

    }

    if (
        maxDealValue !== null &&
        maxDealValue !== undefined
    ) {

        where.dealValue = {
            ...(where.dealValue || {}),
            lte: Number(maxDealValue)
        };

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
    // Query options
    //------------------------------------

    const query = {
        where,
        orderBy
    };

    //------------------------------------
    // Limit
    //------------------------------------

    if (
        limit !== null &&
        limit !== undefined
    ) {

        const parsedLimit = Number(limit);

        if (
            Number.isFinite(parsedLimit) &&
            parsedLimit > 0
        ) {

            query.take =
                Math.floor(parsedLimit);

        }

    }

    //------------------------------------
    // Query customers
    //------------------------------------

    const customers =
        await prisma.customer.findMany(
            query
        );

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