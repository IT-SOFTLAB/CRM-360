const express=require("express");

const router=express.Router();

const {
  getAllOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
    bulkDeleteOpportunities,
  convertLeadToOpportunity,

}=require("../controllers/opportunityController");
const authenticateJWT = require("../middlewares/authMiddleware");

router.use(authenticateJWT);

router.get("/",getAllOpportunities);

router.get("/:id",getOpportunity);

router.post("/",createOpportunity);

router.put("/:id",updateOpportunity);
router.delete("/bulk-delete", bulkDeleteOpportunities);
router.delete("/:id",deleteOpportunity);



router.post(
  "/convert/:leadId",
  convertLeadToOpportunity
);
module.exports=router;