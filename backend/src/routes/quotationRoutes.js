const express = require("express");

const router = express.Router();

const quotationController = require("../controllers/quotationController");

// Create Quotation
router.post("/", quotationController.createQuotation);

// Get All Quotations
router.get("/", quotationController.getAllQuotations);

// Get Single Quotation
router.get("/:id", quotationController.getQuotation);

// Update Quotation
router.put("/:id", quotationController.updateQuotation);

// Delete Quotation
router.delete("/:id", quotationController.deleteQuotation);

// Change Status
router.patch("/:id/status", quotationController.changeQuotationStatus);

// Get Quotations of Particular Opportunity
router.get("/opportunity/:id", quotationController.getOpportunityQuotations);

module.exports = router;