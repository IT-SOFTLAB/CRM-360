const prisma = require("../config/prisma");

const checkLicenseAvailability = async (organizationId) => {
  if (!organizationId) {
    throw new Error("Organization ID is required");
  }

  const superAdmin = await prisma.superAdmin.findFirst({
    where: {
      organizationId,
      status: "Active"
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  if (!superAdmin) {
    return {
      allowed: false,
      message: "No active license found for this organization"
    };
  }

  const activeUserCount = await prisma.user.count({
    where: {
      organizationId,
      status: "Active"
    }
  });

  const licenseCount = superAdmin.License_count;

  return {
    allowed: activeUserCount < licenseCount,
    licenseCount,
    usedLicenses: activeUserCount,
    availableLicenses: Math.max(
      licenseCount - activeUserCount,
      0
    ),
    message:
      activeUserCount >= licenseCount
        ? "License limit reached for this organization"
        : null
  };
};

module.exports = {
  checkLicenseAvailability
};