// const jwt = require('jsonwebtoken');
// const { PrismaClient } = require('@prisma/client');
// const prisma = new PrismaClient();

// const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey';

// const authenticateJWT = async (req, res, next) => {
//   try {
//     let token = null;

//     // 1. Try to get token from Authorization header
//     const authHeader = req.headers.authorization;
//     if (authHeader && authHeader.startsWith('Bearer ')) {
//       token = authHeader.split(' ')[1];
//     }

//     // 2. Try to get token from cookies if not found in header
//     if (!token && req.cookies) {
//       token = req.cookies.accessToken;
//     }

//     if (!token) {
//       return res.status(401).json({ message: 'Authentication token required' });
//     }

//     // Verify token
//     const decoded = jwt.verify(token, JWT_SECRET);
    
//     // Fetch user from DB to verify they still exist and are active
//     const user = await prisma.user.findUnique({
//       where: { id: decoded.userId }
//     });

//     if (!user) {
//       return res.status(401).json({ message: 'User no longer exists' });
//     }

//     if (user.status === 'Inactive') {
//       return res.status(403).json({ message: 'Your account is deactivated' });
//     }

//     if (user.isLocked) {
//       return res.status(403).json({ message: 'Your account is locked' });
//     }

//     // Attach user to request object
//     req.user = user;
//     next();
//   } catch (err) {
//     console.error('JWT authentication error:', err.message);
//     if (err.name === 'TokenExpiredError') {
//       return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
//     }
//     return res.status(401).json({ message: 'Invalid authentication token' });
//   }
// };

// module.exports = authenticateJWT;



const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey";

const authenticateJWT = async (req, res, next) => {

  console.log("\n========== AUTH MIDDLEWARE ==========");
  console.log("Authorization Header:", req.headers.authorization);
  console.log("Cookie accessToken:", req.cookies?.accessToken);
  console.log("Cookie refreshToken:", req.cookies?.refreshToken);

  try {
    let token = null;

    // 1. Authorization header
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
      console.log("Using Authorization header");
    }

    // 2. Cookie
    if (!token && req.cookies) {
      token = req.cookies.accessToken;

      if (token) {
        console.log("Using Cookie token");
      }
    }

    if (!token) {
      console.log("❌ No token received");
      return res.status(401).json({
        message: "Authentication token required"
      });
    }

    console.log("Token used:");
    console.log(token);

    const decoded = jwt.verify(token, JWT_SECRET);

    console.log("Decoded JWT:");
    console.log(decoded);

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId
      }
    });

    console.log("User from DB:");
    console.log(user);

    if (!user) {
      return res.status(401).json({
        message: "User no longer exists"
      });
    }

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