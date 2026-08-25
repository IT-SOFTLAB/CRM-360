// const express = require("express");

// const router = express.Router();

// const authenticateJWT = require("../middlewares/authMiddleware");

// const {
//   requireSuperAdmin,
// } = require("../middlewares/roleMiddleware");

// const outlookIntegration = require(
//   "../controllers/outlookIntegrationController"
// );


// // All Outlook integration settings require authentication
// router.use(authenticateJWT);


// // GET current organization's Outlook configuration
// router.get(
//   "/",
//   requireSuperAdmin,
//   outlookIntegration.getOutlookIntegration
// );


// // SAVE or UPDATE Outlook configuration
// router.put(
//   "/",
//   requireSuperAdmin,
//   outlookIntegration.saveOutlookIntegration
// );


// // DELETE Outlook configuration
// router.delete(
//   "/",
//   requireSuperAdmin,
//   outlookIntegration.deleteOutlookIntegration
// );


// module.exports = router;


const express = require("express");

const router = express.Router();

const authenticateJWT = require("../middlewares/authMiddleware");

const {
  requireSuperAdmin,
} = require("../middlewares/roleMiddleware");

const outlookIntegration = require(
  "../controllers/outlookIntegrationController"
);

router.use((req, res, next) => {
  console.log(
    "🔥 OUTLOOK ROUTER REACHED:",
    req.method,
    req.originalUrl,
    req.baseUrl,
    req.path
  );

  next();
});

router.use(authenticateJWT);

router.get(
  "/",
  (req, res, next) => {
    console.log("🔥 OUTLOOK GET ROUTE REACHED");
    next();
  },
  requireSuperAdmin,
  outlookIntegration.getOutlookIntegration
);

router.put(
  "/",
  requireSuperAdmin,
  outlookIntegration.saveOutlookIntegration
);

router.delete(
  "/",
  requireSuperAdmin,
  outlookIntegration.deleteOutlookIntegration
);

module.exports = router;