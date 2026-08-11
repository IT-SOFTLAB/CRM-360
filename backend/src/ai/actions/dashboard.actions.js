const DashboardService = require("../services/dashboard.service");

module.exports = {

    //----------------------------------------
    // Dashboard Summary
    //----------------------------------------

    async summary(parameters, req) {

        const summary =
            await DashboardService.getSummary(

                req.user

            );

        return {

            success: true,

            message: "Dashboard summary retrieved successfully.",

            data: summary

        };

    }

};