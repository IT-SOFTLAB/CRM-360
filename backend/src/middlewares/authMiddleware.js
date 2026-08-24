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

    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    // Organization ID from URL
    const organizationId = req.params.organizationId;

    /*
      Find the logged-in user.

      We first verify that the user exists.
      Organization access is checked below.
    */
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId
      }
    });

    if (!user) {
      return res.status(401).json({
        message: "User no longer exists"
      });
    }

    // Verify organization access
    if (
      organizationId &&
      user.organizationId !== organizationId
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this organization"
      });
    }

    // Check account status
    if (user.status === "Inactive") {
      return res.status(403).json({
        message: "Your account is deactivated"
      });
    }

    if (user.isLocked) {
      return res.status(403).json({
        message: "Your account is locked"
      });
    }

    // Attach user to request
    req.user = user;

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