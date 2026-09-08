const DashboardTool = require("../tools/dashboard.tool");
const LeadTool = require("../tools/lead.tool");
const ActivityTool = require("../tools/activity.tool");
const PipelineTool = require("../tools/pipeline.tool");
const WorkflowService =
    require("./workflow.service");
const EmailTool = require("../tools/email.tool");
const ReportTool = require("../tools/report.tool");
const QuotationTool = require("../tools/quotation.tool");
const ClientTool = require("../tools/client.tool");
const RetentionTool = require("../tools/retention.tool");

class ToolExecutor {

    constructor() {

        this.tools = {

            dashboard: DashboardTool,

            lead: LeadTool,

            activity: ActivityTool,

            pipeline: PipelineTool,

            email: EmailTool,

            report: ReportTool,

            quotation: QuotationTool,

            client: ClientTool,

            retention: RetentionTool

        };

    }

    //-----------------------------------------
    // Execute Workflow
    //-----------------------------------------

    async execute(plan, req = null) {

        const workflowResults = [];

        //-----------------------------------------
        // Authentication safety check
        //-----------------------------------------

        if (!req?.user) {

            return {

                success: false,

                steps: [],

                context: {},

                message: "Authentication required."

            };

        }

        //-----------------------------------------
        // Execute workflow steps
        //-----------------------------------------

        for (const step of plan.steps) {

            const tool =
                this.tools[step.tool];

            //-----------------------------------------
            // Tool validation
            //-----------------------------------------

            if (!tool) {

                workflowResults.push({

                    success: false,

                    tool: step.tool,

                    action: step.action,

                    message:
                        `Tool '${step.tool}' not found.`

                });

                break;

            }

            try {

                //-----------------------------------------
                // Pass req to tool
                //
                // req.user contains:
                // - id
                // - name
                // - role
                // - organizationId
                //-----------------------------------------

                const result =
                    await tool.execute(
                        step,
                        req
                    );

                //-----------------------------------------
                // Save workflow context
                //-----------------------------------------

                WorkflowService.save(
                    step,
                    result
                );

                workflowResults.push({

                    tool: step.tool,

                    action: step.action,

                    result

                });

                //-----------------------------------------
                // Stop workflow on failure
                //-----------------------------------------

                if (
                    result &&
                    result.success === false
                ) {

                    break;

                }

            }

            catch (err) {

                workflowResults.push({

                    success: false,

                    tool: step.tool,

                    action: step.action,

                    message: err.message

                });

                break;

            }

        }

        return {

            success: true,

            steps: workflowResults,

            context:
                WorkflowService.getAll()

        };

    }

}

module.exports =
    new ToolExecutor();