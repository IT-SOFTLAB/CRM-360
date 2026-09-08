const DashboardService = require("../ai/services/dashboard.service");

exports.getSummary = async (req, res) => {
    try {
        const summary = await DashboardService.getSummary(req.user, req.query);
        return res.json(summary);
    } catch (error) {
        console.error("Error fetching dashboard summary:", error);
        return res.status(500).json({ 
            message: error.message || "Failed to load dashboard summary" 
        });
    }
};
