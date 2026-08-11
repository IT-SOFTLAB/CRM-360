const ReportService = require("../services/report.service");

module.exports = {

    //----------------------------------------
    // Generate Report
    //----------------------------------------

    async generate(parameters, req) {

        const report = await ReportService.generate(

            req.user,

            parameters

        );

        return {

            success: true,

            message: "Report generated successfully.",

            data: report

        };

    }

};