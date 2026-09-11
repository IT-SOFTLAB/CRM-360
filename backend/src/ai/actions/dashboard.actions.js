const DashboardService =
    require("../services/dashboard.service");

module.exports = {

    //----------------------------------------
    // Dashboard Summary
    //----------------------------------------

    async summary(parameters, req) {

        //----------------------------------------
        // Organization validation
        //----------------------------------------

        if (!req?.user?.organizationId) {

            return {

                success: false,

                message:
                    "Organization access is required."

            };

        }

        const summary =
            await DashboardService.getSummary(

                req.user,

                parameters || {}

            );

        return {

            success: true,

            message:
                "Dashboard summary retrieved successfully.",

            data: summary

        };

    }

};