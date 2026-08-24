const organizationMiddleware = (req, res, next) => {
  const { organizationId } = req.params;

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      message: "Organization ID is required"
    });
  }

  req.organizationId = organizationId;

  next();
};

module.exports = organizationMiddleware;