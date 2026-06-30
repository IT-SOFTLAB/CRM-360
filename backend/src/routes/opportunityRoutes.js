const express=require("express");

const router=express.Router();

const {
  getAllOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  convertLeadToOpportunity,

}=require("../controllers/opportunityController");


router.get("/",getAllOpportunities);

router.get("/:id",getOpportunity);

router.post("/",createOpportunity);

router.put("/:id",updateOpportunity);

router.delete("/:id",deleteOpportunity);

router.post(
  "/convert/:leadId",
  convertLeadToOpportunity
);
module.exports=router;