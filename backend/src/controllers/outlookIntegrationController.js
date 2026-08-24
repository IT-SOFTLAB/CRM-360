const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();


// ==========================================
// SAVE / UPDATE OUTLOOK CONFIGURATION
// ==========================================

exports.saveOutlookIntegration = async (req, res) => {
  try {
    const organizationId = req.organizationId;

    const {
      clientId,
      clientSecret,
      tenantId,
      redirectUri,
    } = req.body;

    if (!organizationId) {
      return res.status(400).json({
        message: "Organization ID is missing",
      });
    }

    if (!clientId || !clientSecret || !tenantId || !redirectUri) {
      return res.status(400).json({
        message:
          "Client ID, Client Secret, Tenant ID and Redirect URI are required",
      });
    }

    const integration =
      await prisma.outlookIntegration.upsert({
        where: {
          organizationId,
        },

        update: {
          clientId,
          clientSecret,
          tenantId,
          redirectUri,
          isActive: true,
        },

        create: {
          organizationId,
          clientId,
          clientSecret,
          tenantId,
          redirectUri,
          isActive: true,
        },
      });

    return res.status(200).json({
      success: true,
      message: "Outlook integration saved successfully",
      integration: {
        id: integration.id,
        clientId: integration.clientId,
        tenantId: integration.tenantId,
        redirectUri: integration.redirectUri,
        isActive: integration.isActive,
      },
    });

  } catch (error) {
    console.error(
      "Save Outlook Integration Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to save Outlook integration",
      error: error.message,
    });
  }
};


// ==========================================
// GET OUTLOOK CONFIGURATION
// ==========================================

exports.getOutlookIntegration = async (req, res) => {
  try {
    const organizationId = req.organizationId;

    const integration =
      await prisma.outlookIntegration.findUnique({
        where: {
          organizationId,
        },
      });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message:
          "Outlook integration is not configured for this organization",
      });
    }

    return res.status(200).json({
      success: true,

      integration: {
        id: integration.id,
        clientId: integration.clientId,
        tenantId: integration.tenantId,
        redirectUri: integration.redirectUri,
        isActive: integration.isActive,

        // Never send clientSecret to frontend
        hasClientSecret: !!integration.clientSecret,
      },
    });

  } catch (error) {
    console.error(
      "Get Outlook Integration Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get Outlook integration",
    });
  }
};


// ==========================================
// DELETE / DISABLE OUTLOOK CONFIGURATION
// ==========================================

exports.deleteOutlookIntegration = async (req, res) => {
  try {
    const organizationId = req.organizationId;

    const integration =
      await prisma.outlookIntegration.findUnique({
        where: {
          organizationId,
        },
      });

    if (!integration) {
      return res.status(404).json({
        message:
          "Outlook integration configuration not found",
      });
    }

    await prisma.outlookIntegration.delete({
      where: {
        organizationId,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Outlook integration removed successfully",
    });

  } catch (error) {
    console.error(
      "Delete Outlook Integration Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to remove Outlook integration",
    });
  }
};