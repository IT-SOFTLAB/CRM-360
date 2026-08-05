module.exports = {
  name: "dashboard",

  async execute() {
    return {
      success: true,
      message: "Dashboard Tool Executed",
      data: {
        totalLeads: 120,
        totalSales: 45,
      },
    };
  },
};