const DashboardTool = require("../tools/dashboard.tool");
const LeadTool = require("../tools/lead.tool");
const ActivityTool = require("../tools/activity.tool");
const PipelineTool = require("../tools/pipeline.tool");

class ToolExecutor {
  constructor() {
    this.tools = {
      dashboard: DashboardTool,
      lead: LeadTool,
      activity: ActivityTool,
      pipeline: PipelineTool,
    };
  }

  async execute(toolName, args = {}) {
    try {
      const tool = this.tools[toolName];

      if (!tool) {
        return {
          success: false,
          message: `Tool '${toolName}' not found.`,
        };
      }

      if (typeof tool.execute !== "function") {
        return {
          success: false,
          message: `Tool '${toolName}' has no execute() function.`,
        };
      }

      return await tool.execute(args);
    } catch (error) {
      console.error("Tool Executor Error:", error);

      return {
        success: false,
        message: error.message || "Tool execution failed.",
      };
    }
  }

  getAvailableTools() {
    return Object.keys(this.tools);
  }
}

module.exports = new ToolExecutor();