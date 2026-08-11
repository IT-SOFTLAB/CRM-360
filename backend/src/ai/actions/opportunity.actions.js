const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const dbPath = path.join(__dirname, "../../../db.json");
const PipelineService = require("../services/pipelineService");

const prisma = new PrismaClient();

function readDB() {
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf8");
}

module.exports = {

    async moveStage({ lead, stage }, req) {

    let opportunity = await PipelineService.moveStage(

        lead,

        stage,

        req.user

    );

    if (!opportunity) {

        return {

            success: false,

                message:"Opportunity not found."

            }

        }

    let updated = opportunity;

        // Authorization check
        if (req && req.user) {
            const AuthorizationService = require("../services/authorization.service");
            if (!AuthorizationService.isAdminLike(req.user)) {
                if (opportunity.leadId) {
                    const assocLead = await prisma.lead.findUnique({
                        where: { id: opportunity.leadId }
                    });
                    if (assocLead && assocLead.assignedUserId !== req.user.id) {
                        return {
                            success: false,
                            message: "Access denied. You do not own this opportunity's lead."
                        };
                    }
                } else if (opportunity.assignedSalespersonId !== req.user.id) {
                    return {
                        success: false,
                        message: "Access denied. You do not own this opportunity."
                    };
                }
            }
        }

        // Read and find/create the stage in db.json pipelines
        const db = readDB();
        let matchedStage = db.pipelines.find(p => p.name.toLowerCase() === stage.toLowerCase().trim());
        
        if (!matchedStage) {
            const maxOrder = db.pipelines.reduce((max, p) => p.order > max ? p.order : max, 0);
            const formattedName = stage.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            matchedStage = {
                id: 'p_' + Date.now(),
                name: formattedName,
                order: maxOrder + 1
            };
            db.pipelines.push(matchedStage);
            writeDB(db);
        }

        const stageName = matchedStage.name;
        const stageId = matchedStage.id;

        updated = await prisma.opportunity.update({

            where:{

                id:opportunity.id

            },

            data:{

                stage: stageName,
                stageId: stageId

            }

        });

        if(updated.leadId){

            await prisma.lead.update({

                where:{

                    id:updated.leadId

                },

                data:{

                    status: stageName

                }

            });

        }

        // Keep db.json synced for opportunities and leads
        const dbSync = readDB();
        const oppIdx = dbSync.opportunities.findIndex(o => o.id === opportunity.id);
        if (oppIdx !== -1) {
            dbSync.opportunities[oppIdx].stage = stageName;
            dbSync.opportunities[oppIdx].stageId = stageId;
        }
        if (updated.leadId) {
            const leadIdx = dbSync.leads.findIndex(l => l.id === updated.leadId);
            if (leadIdx !== -1) {
                dbSync.leads[leadIdx].status = stageName;
            }
        }
        writeDB(dbSync);

        return{

            success:true,

            message:`${lead} moved to ${stageName}.`,

        data: updated

    };

}

};