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
        success: false,
        message: "Organization ID is missing",
      });
    }

    // Required fields except clientSecret on update
    if (!clientId || !tenantId || !redirectUri) {
      return res.status(400).json({
        success: false,
        message:
          "Client ID, Tenant ID and Redirect URI are required",
      });
    }

    const existingIntegration =
      await prisma.outlookIntegration.findUnique({
        where: {
          organizationId,
        },
      });

    // Client secret is required when creating configuration
    if (!existingIntegration && !clientSecret) {
      return res.status(400).json({
        success: false,
        message:
          "Client Secret is required when creating Outlook integration",
      });
    }

    const updateData = {
      clientId,
      tenantId,
      redirectUri,
        isConfigured: true,
    };

    // Only update secret if Super Admin entered a new one
    if (clientSecret && clientSecret.trim()) {
      updateData.clientSecret = clientSecret.trim();
    }

 const integration = await prisma.outlookIntegration.upsert({
  where: {
    organizationId,
  },

  update: {
    clientId: clientId.trim(),
    tenantId: tenantId.trim(),
    redirectUri: redirectUri.trim(),
    isConfigured: true,
    ...updateData,
  },

  create: {
    organizationId,
    clientId: clientId.trim(),
    clientSecret: clientSecret.trim(),
    tenantId: tenantId.trim(),
    redirectUri: redirectUri.trim(),
    isConfigured: true,
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
       isConfigured: integration.isConfigured,
        hasClientSecret: !!integration.clientSecret,
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
      return res.status(200).json({
        success: true,
        integration: null,
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
        isConfigured: integration.isConfigured,

        // Never send the actual secret
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