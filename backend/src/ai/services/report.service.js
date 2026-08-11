const DashboardService = require("./dashboard.service");

class ReportService {

    //------------------------------------
    // Generate Report
    //------------------------------------

    async generate(user, filters = {}) {

        const dashboard =

            await DashboardService.getSummary(

                user,

                filters

            );

        return {

            title: "CRM Performance Report",

            generatedAt: new Date(),

            summary: dashboard

        };

    }

}

module.exports = new ReportService();