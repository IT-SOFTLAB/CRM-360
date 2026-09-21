const express = require("express");

const router = express.Router({ mergeParams: true });

const productController = require("../controllers/productController");

const authenticateJWT = require("../middlewares/authMiddleware");

// Protect all product routes
router.use(authenticateJWT);

// Create Product
router.post("/", productController.createProduct);

// Get All Products
router.get("/", productController.getAllProducts);

// Get Single Product
router.get("/:id", productController.getProduct);

// Update Product
router.put("/:id", productController.updateProduct);

// Change Product Status
router.patch("/:id/status", productController.changeProductStatus);
router.delete("/:id", productController.deleteProduct);
module.exports = router;