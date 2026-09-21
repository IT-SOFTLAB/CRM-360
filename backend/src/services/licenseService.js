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

  const usedLicenses = activeUserCount + (superAdmin.status === "Active" ? 1 : 0);
  const licenseCount = superAdmin.License_count;

    return {
    allowed: usedLicenses < licenseCount,
    licenseCount,
    usedLicenses: usedLicenses,
    availableLicenses: Math.max(
      licenseCount - usedLicenses,
      0
    ),
    message:
      usedLicenses >= licenseCount
        ? "License limit reached for this organization"
        : null
  };
};

module.exports = {
  checkLicenseAvailability
};