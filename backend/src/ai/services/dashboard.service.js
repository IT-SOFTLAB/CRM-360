const { PrismaClient } = require("@prisma/client");
const AuthorizationService = require("./authorization.service");
const {
    getCache,
    setCache
} = require("../../config/redisCache");
const prisma = new PrismaClient();

class DashboardService {


    
    //----------------------------------------
    // Dashboard Summary
    //----------------------------------------

    async getSummary(user, filters = {}) {

    // ----------------------------------------
    // Redis Dashboard Cache
    // ----------------------------------------

    const organizationId = user.organizationId;

    const userId = user.id;
const userRole = user.role;

const cacheKey = `crm:dashboard:${organizationId}:${userRole}:${userId}`;

    // Check Redis first
    const cachedDashboard = await getCache(cacheKey);

    if (cachedDashboard) {

        console.log(
            `Dashboard cache HIT: ${cacheKey}`
        );

        return cachedDashboard;
    }

    console.log(
        `Dashboard cache MISS: ${cacheKey}`
    );

    let leadDateFilter = {};

if (filters.startDate && filters.endDate) {

    leadDateFilter = {

        createdAt: {

            gte: filters.startDate,

            lte: filters.endDate

        }

    };

}

        const leadWhere =
            AuthorizationService.leadFilter(user);

        const opportunityWhere =
            AuthorizationService.opportunityFilter(user);

        //----------------------------------------
        // Total Leads
        //----------------------------------------

        const totalLeads =
            await prisma.lead.count({

                where: leadWhere

            });

        //----------------------------------------
        // Total Opportunities
        //----------------------------------------

        const totalOpportunities =
            await prisma.opportunity.count({

                where: opportunityWhere

            });



const today = new Date();

today.setHours(0, 0, 0, 0);

const tomorrow = new Date(today);

tomorrow.setDate(today.getDate() + 1);

const todayActivities = await prisma.activity.count({

    where: {
          organizationId: user.organizationId,
        date: {

            gte: today,

            lt: tomorrow

        }

    }

});

//----------------------------------------
// Pending Activities
//----------------------------------------

const pendingActivities = await prisma.activity.count({

    where: {
         organizationId: user.organizationId,
        done: false

    }

});

//----------------------------------------
// Pipeline Stage Distribution
//----------------------------------------

const pipelineStages = await prisma.opportunity.groupBy({

    by: ["stage"],

    where: opportunityWhere,

    _count: {

        stage: true

    }

});

const stageSummary = {};

pipelineStages.forEach(stage => {

    stageSummary[stage.stage] = stage._count.stage;

});

//----------------------------------------
// Lead Category Distribution
//----------------------------------------

const leadCategories = await prisma.lead.groupBy({

    by: ["category"],

    where: leadWhere,

    _count: {

        category: true

    }

});

const categorySummary = {};

leadCategories.forEach(category => {

    const key =

        category.category &&
        category.category.trim() !== ""

            ? category.category.trim()

            : "Uncategorized";

    const normalized =

        key
            .toLowerCase()
            .replace(/\b\w/g, c => c.toUpperCase());

    categorySummary[normalized] =

        (categorySummary[normalized] || 0)

        +

        category._count.category;

});



//----------------------------------------
// Revenue Analytics
//----------------------------------------

const revenue = await prisma.opportunity.aggregate({

    where: opportunityWhere,

    _sum: {

        dealValue: true

    },

    _avg: {

        dealValue: true

    },

    _max: {

        dealValue: true

    },

    _min: {

        dealValue: true

    }

});

const wonDeals =
await prisma.opportunity.count({

    where:{

        ...opportunityWhere,

        stage:"Won"

    }

});

const lostDeals =
await prisma.opportunity.count({

    where:{

        ...opportunityWhere,

        stage:"Lost"

    }

});

const closedDeals =

wonDeals + lostDeals;

const winRate =

closedDeals === 0

? 0

: Number(

(

wonDeals / closedDeals

*100

).toFixed(2)

);



const dashboardData = {

    totalLeads,

    totalOpportunities,

    wonDeals,

    lostDeals,

    winRate,

    pipelineValue:
        revenue._sum.dealValue || 0,

    averageDealSize:
        Math.round(
            revenue._avg.dealValue || 0
        ),

    largestDeal:
        revenue._max.dealValue || 0,

    smallestDeal:
        revenue._min.dealValue || 0,

    todayActivities,

    pendingActivities,

    pipelineStages:
        stageSummary,

    leadCategories:
        categorySummary
};

// ----------------------------------------
// Store Dashboard in Redis
// TTL = 5 minutes
// ----------------------------------------

await setCache(
    cacheKey,
    dashboardData,
    300
);

console.log(
    `Dashboard cached: ${cacheKey}`
);

return dashboardData;
 }

}

module.exports = new DashboardService();