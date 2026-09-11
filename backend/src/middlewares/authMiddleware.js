const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey";

const authenticateJWT = async (req, res, next) => {
  console.log("\n========== AUTH MIDDLEWARE ==========");

  try {
    let token = null;

    // 1. Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const extractedToken = authHeader.split(" ")[1];

      if (
        extractedToken &&
        extractedToken !== "undefined" &&
        extractedToken !== "null"
      ) {
        token = extractedToken;
      }
    }

    // 2. Get token from cookie if not found in header
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        message: "Authentication token required"
      });
    }

    // 3. Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    // 4. Organization ID from URL
    const organizationId = req.params.organizationId;

    // 5. First check normal User table
    let user = await prisma.user.findUnique({
      where: {
        id: decoded.userId
      }
    });

    // 6. If not found, check SuperAdmin table
    if (!user) {
      const superAdmin = await prisma.superAdmin.findUnique({
        where: {
          id: decoded.userId
        }
      });

      if (superAdmin) {
        // Check SuperAdmin status
        if (superAdmin.status === "Inactive") {
          return res.status(403).json({
            message: "Your account is deactivated"
          });
        }

        // Create req.user-compatible object
        user = {
          id: superAdmin.id,
          name: superAdmin.name,
          email: superAdmin.email,
          role: "SUPER_ADMIN",
          organizationId: superAdmin.organizationId,
          status: superAdmin.status
        };

        console.log("✅ SuperAdmin authenticated:", superAdmin.email);
      }
    }

    // 7. Neither User nor SuperAdmin exists
    if (!user) {
      return res.status(401).json({
        message: "User no longer exists"
      });
    }

    // 8. Verify organization access
    if (
      organizationId &&
      user.organizationId !== organizationId
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this organization"
      });
    }

    // 9. Check account status
    if (user.status === "Inactive") {
      return res.status(403).json({
        message: "Your account is deactivated"
      });
    }

    // 10. Check if account is locked
    if (user.isLocked) {
      return res.status(403).json({
        message: "Your account is locked"
      });
    }

    // 11. Attach authenticated user
    req.user = user;

    console.log("✅ Authentication successful");
    console.log("User:", user.email);
    console.log("Role:", user.role);
    console.log("Organization:", user.organizationId);

    next();

  } catch (err) {
    console.log("❌ JWT FAILED");
    console.log("Error Name:", err.name);
    console.log("Error Message:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired",
        code: "TOKEN_EXPIRED"
      });
    }

    return res.status(401).json({
      message: "Invalid authentication token"
    });
  }
};

module.exports = authenticateJWT;