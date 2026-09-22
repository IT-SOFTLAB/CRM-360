const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// CREATE PRODUCT
const createProduct = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can create products"
      });
    }

    const { name, price } = req.body;
    const organizationId = req.user.organizationId;

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Product name and price are required"
      });
    }

    if (Number(price) < 0) {
      return res.status(400).json({
        success: false,
        message: "Price cannot be negative"
      });
    }

    const existingProduct = await prisma.product.findFirst({
      where: {
        name: name.trim(),
        organizationId
      }
    });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: "Product already exists"
      });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        price: Number(price),
        organizationId
      }
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product
    });

  } catch (error) {
    console.error("Create Product Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create product"
    });
  }
};


// GET ALL PRODUCTS
// GET ALL PRODUCTS
const getAllProducts = async (req, res) => {
  try {
    const userOrganizationId = req.user?.organizationId;
    const requestedOrganizationId = req.params.organizationId;

    console.log("========== GET PRODUCTS DEBUG ==========");
    console.log("User Organization ID:", userOrganizationId);
    console.log("Requested Organization ID:", requestedOrganizationId);
    console.log("User:", req.user);
    console.log("========================================");

    if (!userOrganizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID not found for logged-in user"
      });
    }

    if (!requestedOrganizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID missing from request"
      });
    }

    // Security check:
    // User can only access products belonging to their own organization
    if (userOrganizationId !== requestedOrganizationId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this organization"
      });
    }

    const products = await prisma.product.findMany({
      where: {
        organizationId: userOrganizationId
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.status(200).json({
      success: true,
      products
    });

  } catch (error) {
    console.error("Get Products Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message
    });
  }
};


// GET SINGLE PRODUCT
const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const product = await prisma.product.findFirst({
      where: {
        id,
        organizationId
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.status(200).json({
      success: true,
      product
    });

  } catch (error) {
    console.error("Get Product Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product"
    });
  }
};


// UPDATE PRODUCT
const updateProduct = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can update products"
      });
    }

    const { id } = req.params;
    const { name, price } = req.body;
    const organizationId = req.user.organizationId;

    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        organizationId
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Product name and price are required"
      });
    }

    const product = await prisma.product.update({
      where: {
        id
      },
      data: {
        name: name.trim(),
        price: Number(price)
      }
    });

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product
    });

  } catch (error) {
    console.error("Update Product Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update product"
    });
  }
};


// CHANGE PRODUCT STATUS
const changeProductStatus = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can change product status"
      });
    }

    const { id } = req.params;
    const { status } = req.body;
    const organizationId = req.user.organizationId;

    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Active or Inactive"
      });
    }

    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        organizationId
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const product = await prisma.product.update({
      where: {
        id
      },
      data: {
        status
      }
    });

    res.status(200).json({
      success: true,
      message: "Product status updated successfully",
      product
    });

  } catch (error) {
    console.error("Change Product Status Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update product status"
    });
  }
};


const deleteProduct = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can delete products"
      });
    }

    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const product = await prisma.product.findFirst({
      where: {
        id,
        organizationId
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    await prisma.product.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });

  } catch (error) {
    console.error("Delete Product Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete product"
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
   changeProductStatus,
  deleteProduct
};