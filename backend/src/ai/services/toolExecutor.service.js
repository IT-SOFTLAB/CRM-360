const DashboardTool = require("../tools/dashboard.tool");
const LeadTool = require("../tools/lead.tool");
const ActivityTool = require("../tools/activity.tool");
const PipelineTool = require("../tools/pipeline.tool");
const WorkflowService =
require("./workflow.service");
const EmailTool = require("../tools/email.tool");
class ToolExecutor {

    constructor() {

        this.tools = {

            dashboard: DashboardTool,

            lead: LeadTool,

            activity: ActivityTool,

            pipeline: PipelineTool,
             email: EmailTool

        };

    }

    //-----------------------------------------
    // Execute Workflow
    //-----------------------------------------

   async execute(plan, req = null) {

        const workflowResults = [];

        for (const step of plan.steps) {

            const tool = this.tools[step.tool];

            if (!tool) {

                workflowResults.push({

                    success: false,

                    tool: step.tool,

                    message: `Tool '${step.tool}' not found.`

                });

                continue;

            }

            try {

               const result =
    await tool.execute(step, req);
                    WorkflowService.save(
    step,
    result
);

                workflowResults.push({

                    tool: step.tool,

                    action: step.action,

                    result

                });

            }

            catch (err) {

                workflowResults.push({

                    success: false,

                    tool: step.tool,

                    action: step.action,

                    message: err.message

                });

            }

        }

      return {

    steps: workflowResults,

    context: WorkflowService.getAll()

};

    }

}

module.exports = new ToolExecutor();