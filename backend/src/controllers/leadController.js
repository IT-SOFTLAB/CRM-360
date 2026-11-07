const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getCache, setCache, deletePatternCache } = require('../config/redisCache');

const invalidateLeadCache = async (organizationId) => {
  if (!organizationId) return;
  await deletePatternCache(`crm:leads:${organizationId}:*`);
  await deletePatternCache(`crm:opportunities:${organizationId}:*`);
  await deletePatternCache(`crm:bootstrap:${organizationId}:*`);
  await deletePatternCache(`crm:dashboard:${organizationId}:*`);
};

const createLead = async (req, res) => {
  try {
    const now = new Date();
    const user = req.user;

    // Fallback to creator user if assignee is not explicitly specified in req.body
    const assignedUserId = req.body.assignedUserId || user.id;
    const assignedUser = req.body.assignedUser || user.name;

    const lead = await prisma.lead.create({
      data: {
        organizationId: req.organizationId,
        contactName: req.body.contactName,
        company: req.body.company,
        email: req.body.email,
        phone: req.body.phone,
        linkedinId: req.body.linkedinId,
        category: req.body.category || '',
        serviceType: req.body.serviceType,
        assignedUser: assignedUser || null,
        assignedUserId: assignedUserId || null,
        status: 'New',
        dealValue: req.body.dealValue ? Number(req.body.dealValue) : 0,
        createdAt: now
      }
    });

    // Automatically create a corresponding Opportunity in the "New" stage
    await prisma.opportunity.create({
      data: {
        organizationId: req.organizationId,
        leadId: lead.id,
        customerName: lead.contactName,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        linkedinId: lead.linkedinId,
        dealValue: lead.dealValue || 0,
        stage: 'New',
        assignedSalesperson: lead.assignedUser,
        assignedSalespersonId: lead.assignedUserId,
        createdAt: lead.createdAt
      }
    });

    // Send assignment notification email
    if (assignedUserId) {
      const { sendLeadAssignmentEmail } = require('../services/leadEmailService');
      const leadInfoForEmail = [{
        contactName: lead.contactName,
        company: lead.company,
        email: lead.email
      }];
      sendLeadAssignmentEmail(req, assignedUserId, leadInfoForEmail).catch(err => {
        console.error("Error sending assignment email in createLead:", err);
      });
    }
   await invalidateLeadCache(req.organizationId);
  res.status(201).json(lead);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message
    });
  }
};

const getAllLeads = async (req, res) => {
  try {
    const user = req.user;
    const userRole = (user.role || '').toUpperCase().replace(/[\s_]+/g, '_');
    const organizationId = req.organizationId;
    const userId = user.id;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;
    const searchStr = (req.query.search || '').trim();

    // Construct unique cache key
    const cacheKey = `crm:leads:${organizationId}:${userRole}:${userId}:p${page}_l${limit}_s${searchStr || 'all'}_paginated:${isPaginated}`;

    // 1. Check Redis Cache First
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log(`Leads cache HIT: ${cacheKey}`);
      return res.status(200).json(cachedData);
    }

    console.log(`Leads cache MISS: ${cacheKey}`);

    // Build Prisma query
    let whereClause = { organizationId };
    if (userRole === 'USER') {
      whereClause.OR = [
        { assignedUserId: user.id },
        { assignedUser: user.name }
      ];
    }

    if (searchStr) {
      whereClause.AND = [
        {
          OR: [
            { contactName: { contains: searchStr, mode: 'insensitive' } },
            { company: { contains: searchStr, mode: 'insensitive' } },
            { email: { contains: searchStr, mode: 'insensitive' } },
            { phone: { contains: searchStr, mode: 'insensitive' } }
          ]
        }
      ];
    }

    let responseData;

    if (isPaginated) {
      const skip = (page - 1) * limit;
      const [leads, totalCount] = await Promise.all([
        prisma.lead.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" }
        }),
        prisma.lead.count({ where: whereClause })
      ]);

      const totalPages = Math.ceil(totalCount / limit);
      responseData = {
        leads,
        pagination: {
          totalCount,
          page,
          limit,
          totalPages
        }
      };
    } else {
      const leads = await prisma.lead.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" }
      });
      responseData = leads;
    }

    // 2. Store in Redis Cache (TTL = 5 minutes / 300 seconds)
    await setCache(cacheKey, responseData, 300);

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("getAllLeads error:", error);
    res.status(500).json({ message: error.message });
  }
};

const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.lead.findFirst({
      where: { id: id, organizationId: req.organizationId }
    });
    if (!existing) return res.status(404).json({ message: "Lead not found" });

    // Delete associated opportunities first
    await prisma.opportunity.deleteMany({
      where: { leadId: id, organizationId: req.organizationId }
    }).catch(err => console.log("Associated opportunities deletion failed:", err.message));

    await prisma.lead.delete({
      where: {
           id: id
      }
    });
   await invalidateLeadCache(req.organizationId);
    res.status(200).json({
      success: true,
      message: "Lead and associated opportunities deleted successfully"
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const updateLead = async (req, res) => {
  try {
    const { id } = req.params;

    // Get current lead to check if assignee changed
    const currentLead = await prisma.lead.findFirst({
      where: { id, organizationId: req.organizationId }
    });
    if (!currentLead) return res.status(404).json({ message: "Lead not found" });

    let finalAssignedUser = req.body.assignedUser;
    let finalAssignedUserId = req.body.assignedUserId;

    // Resolve user if either assignedUserId or assignedUser is missing
    if (finalAssignedUserId && !finalAssignedUser) {
      const u = await prisma.user.findUnique({ where: { id: finalAssignedUserId } });
      if (u) finalAssignedUser = u.name;
    } else if (finalAssignedUser && !finalAssignedUserId) {
      const u = await prisma.user.findFirst({
        where: {
          name: { equals: finalAssignedUser, mode: 'insensitive' },
          organizationId: req.organizationId
        }
      });
      if (u) finalAssignedUserId = u.id;
    }

    const lead = await prisma.lead.update({
      where: {
        id: id
      },
      data: {
        contactName: req.body.contactName,
        company: req.body.company,
        source: req.body.source,
        email: req.body.email,
        phone: req.body.phone,
        linkedinId: req.body.linkedinId,
        category: req.body.category,
        serviceType: req.body.serviceType,
        assignedUser: finalAssignedUser !== undefined ? finalAssignedUser : currentLead.assignedUser,
        assignedUserId: finalAssignedUserId !== undefined ? finalAssignedUserId : currentLead.assignedUserId,
        status: req.body.status
      }
    });

    // Send single lead assignment email if assignee changed and is not null
    const assignedUserIdChanged = 
      lead.assignedUserId !== currentLead?.assignedUserId && 
      lead.assignedUserId;

    if (assignedUserIdChanged) {
      const { sendLeadAssignmentEmail } = require('../services/leadEmailService');
      const leadInfoForEmail = [{
        contactName: lead.contactName,
        company: lead.company,
        email: lead.email
      }];
      sendLeadAssignmentEmail(req, lead.assignedUserId, leadInfoForEmail).catch(err => {
        console.error("Error sending single lead assign email:", err);
      });
    }

    // Also update associated opportunity and customer if key fields or salesperson change
    const oppUpdateData = {};
    if (req.body.contactName !== undefined) oppUpdateData.customerName = req.body.contactName;
    if (req.body.company !== undefined) oppUpdateData.company = req.body.company;
    if (req.body.email !== undefined) oppUpdateData.email = req.body.email;
    if (req.body.phone !== undefined) oppUpdateData.phone = req.body.phone;
    if (req.body.linkedinId !== undefined) oppUpdateData.linkedinId = req.body.linkedinId;
    if (req.body.dealValue !== undefined) {
      oppUpdateData.dealValue = req.body.dealValue ? Number(req.body.dealValue) : 0;
    }
    if (req.body.status !== undefined) oppUpdateData.stage = req.body.status;
    if (req.body.assignedUser !== undefined || req.body.assignedUserId !== undefined || finalAssignedUser || finalAssignedUserId) {
      oppUpdateData.assignedSalesperson = lead.assignedUser;
      oppUpdateData.assignedSalespersonId = lead.assignedUserId;
    }

    if (Object.keys(oppUpdateData).length > 0) {
      const oppRes = await prisma.opportunity.updateMany({
        where: { leadId: id, organizationId: req.organizationId },
        data: oppUpdateData
      });

      // If no existing opportunity matched leadId, find or create one to maintain pipeline sync
      if (oppRes.count === 0) {
        const existingOpp = await prisma.opportunity.findFirst({
          where: {
            organizationId: req.organizationId,
            OR: [
              { leadId: id },
              lead.email ? { email: lead.email } : undefined
            ].filter(Boolean)
          }
        });

        if (existingOpp) {
          await prisma.opportunity.update({
            where: { id: existingOpp.id },
            data: {
              leadId: id,
              ...oppUpdateData
            }
          });
        } else {
          await prisma.opportunity.create({
            data: {
              organizationId: req.organizationId,
              leadId: id,
              customerName: lead.contactName,
              company: lead.company,
              email: lead.email,
              phone: lead.phone,
              dealValue: lead.dealValue || 0,
              stage: lead.status || 'New',
              assignedSalesperson: lead.assignedUser,
              assignedSalespersonId: lead.assignedUserId,
              createdAt: lead.createdAt
            }
          });
        }
      }
    }

    if (req.body.assignedUser !== undefined || req.body.assignedUserId !== undefined || finalAssignedUser || finalAssignedUserId) {
      const opps = await prisma.opportunity.findMany({
        where: { leadId: id, organizationId: req.organizationId },
        select: { id: true }
      });
      const oppIds = opps.map(o => o.id);
      if (oppIds.length > 0) {
        await prisma.customer.updateMany({
          where: { opportunityId: { in: oppIds }, organizationId: req.organizationId },
          data: {
            assignedSalesperson: lead.assignedUser,
            assignedSalespersonId: lead.assignedUserId
          }
        });
      }
    }

    await invalidateLeadCache(req.organizationId);
    res.status(200).json(lead);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const xlsx = require('xlsx');


const normalizeKey = (k) => (k ? k.toString().replace(/[\s_-]+/g, '').toLowerCase() : '');

function getVal(row, keyNames) {
  const cleanRow = {};
  for (const k of Object.keys(row)) {
    cleanRow[normalizeKey(k)] = row[k];
  }
  for (const name of keyNames) {
    const normName = normalizeKey(name);
    if (cleanRow[normName] !== undefined && cleanRow[normName] !== null) {
      return cleanRow[normName];
    }
  }
  return null;
}

const importLeads = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const organizationId = req.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is missing"
      });
    }

    // Read Excel / CSV file
    let workbook;

    try {
      workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    } catch (err) {
      console.error("File parsing error:", err);

      return res.status(400).json({
        success: false,
        message: "Failed to parse CSV/Excel file"
      });
    }

    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return res.status(400).json({
        success: false,
        message: "Uploaded file contains no worksheet"
      });
    }

    const worksheet = workbook.Sheets[sheetName];

    // Read headers
    const sheetRows = xlsx.utils.sheet_to_json(
      worksheet,
      { header: 1 }
    );

    const headers = sheetRows[0] || [];
    const normalizedHeaders = headers.map(normalizeKey);

    const requiredAliases = {
      contactName: ["contactName", "name"],
      category: ["category"],
      serviceType: ["serviceType", "servicetype"],
      company: ["company"],
      email: ["email"],
      phone: ["phone"],
      linkedinId: ["linkedinId", "linkedinid", "linkedin", "linkedin id"]
    };

    const missingFields = Object.keys(requiredAliases).filter(field => {
      return !requiredAliases[field].some(alias =>
        normalizedHeaders.includes(normalizeKey(alias))
      );
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required column headers: ${missingFields.join(", ")}`
      });
    }

    const results = xlsx.utils.sheet_to_json(worksheet);

    // Normalize values before comparing records
    const normalizeValue = (value) => {
      if (value === undefined || value === null) {
        return "";
      }

      return String(value).trim().toLowerCase();
    };

    // Generate a unique comparison key using ALL imported fields
    const generateLeadKey = (lead) => {
      const fields = [
        lead.contactName,
        lead.company,
        lead.email,
        lead.phone,
        lead.category,
        lead.serviceType,
        lead.linkedinId
      ];

      return JSON.stringify(fields.map(normalizeValue));
    };

    // Resolve default assignee
    const { teamId } = req.query;

    let initialAssigneeName = req.user?.name || "Admin";
    let initialAssigneeId = req.user?.id || null;

    if (teamId) {
      try {
        const team = await prisma.salesTeam.findFirst({
          where: {
            id: teamId,
            organizationId
          },
          include: {
            leader: true,
            members: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });

        if (team) {
          if (team.leader) {
            initialAssigneeName = team.leader.name;
            initialAssigneeId = team.leader.id;
          } else if (team.members?.length > 0) {
            initialAssigneeName = team.members[0].name;
            initialAssigneeId = team.members[0].id;
          }
        }
      } catch (teamErr) {
        console.warn(
          "Failed to resolve team leader:",
          teamErr.message
        );
      }
    }

    // 1. Fetch existing leads of this organization
    const existingLeads = await prisma.lead.findMany({
      where: { organizationId },
      select: {
        contactName: true,
        company: true,
        email: true,
        phone: true,
        category: true,
        serviceType: true,
        linkedinId: true
      }
    });

    // Store existing lead fingerprints
    const existingLeadKeys = new Set(
      existingLeads.map(generateLeadKey)
    );

    const createdLeads = [];

    let duplicatesSkipped = 0;
    let failed = 0;
    let invalidSkipped = 0;

    // 2. Process uploaded records
    for (const row of results) {
      try {
        const contactName = getVal(row, [
          "contactName",
          "name"
        ]);

        if (!contactName || !contactName.toString().trim()) {
          invalidSkipped++;
          continue;
        }

        const leadData = {
          contactName: contactName.toString().trim(),

          company: (() => {
            const value = getVal(row, ["company"]);
            return value ? value.toString().trim() : null;
          })(),

          email: (() => {
            const value = getVal(row, ["email"]);
            return value ? value.toString().trim() : null;
          })(),

          phone: (() => {
            const value = getVal(row, ["phone"]);
            return value !== null && value !== undefined
              ? value.toString().trim()
              : null;
          })(),

          category: (
            getVal(row, ["category"]) || ""
          ).toString().trim(),

          serviceType: (
            getVal(row, ["serviceType", "servicetype"]) || ""
          ).toString().trim(),

          linkedinId: (() => {
            const value = getVal(row, [
              "linkedinId",
              "linkedinid",
              "linkedin",
              "linkedin id"
            ]);

            return value ? value.toString().trim() : null;
          })()
        };

        // 3. Check duplicate against existing DB records
        // and previously processed rows in this upload
        const leadKey = generateLeadKey(leadData);

        if (existingLeadKeys.has(leadKey)) {
          duplicatesSkipped++;
          continue;
        }

        // 4. Create Lead and corresponding Opportunity together
        // so a failed Opportunity creation does not leave
        // an incomplete imported Lead.
        const lead = await prisma.$transaction(async (tx) => {
          const newLead = await tx.lead.create({
            data: {
              organizationId,
              contactName: leadData.contactName,
              company: leadData.company,
              email: leadData.email,
              phone: leadData.phone,
              category: leadData.category,
              serviceType: leadData.serviceType,
              linkedinId: leadData.linkedinId,

              assignedUser: initialAssigneeName,
              assignedUserId: initialAssigneeId,

              status: "New",
              dealValue: 0,
              createdAt: new Date()
            }
          });

          await tx.opportunity.create({
            data: {
              organizationId,
              leadId: newLead.id,

              customerName: newLead.contactName,
              company: newLead.company,
              email: newLead.email,
              phone: newLead.phone,
              linkedinId: newLead.linkedinId,

              dealValue: 0,
              stage: "New",

              assignedSalesperson: newLead.assignedUser,
              assignedSalespersonId: newLead.assignedUserId,

              createdAt: newLead.createdAt
            }
          });

          return newLead;
        });

        createdLeads.push(lead);

        // Add successfully imported record to the set.
        // This also prevents duplicates within the same file.
        existingLeadKeys.add(leadKey);

      } catch (rowError) {
        failed++;

        console.error(
          "Lead import row failed:",
          rowError.message
        );
      }
    }

    // 5. Clear Redis cache
    if (createdLeads.length > 0) {
      await invalidateLeadCache(organizationId);
    }

    // 6. Return import summary
    return res.status(200).json({
      success: true,
      message: "Lead import completed successfully",

      summary: {
        totalUploaded: results.length,
        imported: createdLeads.length,
        duplicatesSkipped,
        invalidSkipped,
        failed
      },

      leadsCount: createdLeads.length,
      leads: createdLeads
    });

  } catch (error) {
    console.error("Import controller error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const bulkAssignLeads = async (req, res) => {
  try {
    let { ids, assignedUser, assignedUserId } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No leads selected' });
    }

    // Resolve user if missing assignedUser or assignedUserId
    if (assignedUserId && !assignedUser) {
      const u = await prisma.user.findUnique({ where: { id: assignedUserId } });
      if (u) assignedUser = u.name;
    } else if (assignedUser && !assignedUserId) {
      const u = await prisma.user.findFirst({
        where: {
          name: { equals: assignedUser, mode: 'insensitive' },
          organizationId: req.organizationId
        }
      });
      if (u) assignedUserId = u.id;
    }

    // Fetch leads details for email notification
    const leadsForEmail = await prisma.lead.findMany({
      where: {
        id: { in: ids },
        organizationId: req.organizationId
      },
      select: {
        id: true,
        contactName: true,
        company: true,
        email: true,
        phone: true,
        status: true,
        dealValue: true,
        createdAt: true
      }
    });

    // 1. Update in PostgreSQL
    const updated = await prisma.lead.updateMany({
      where: {
        id: { in: ids },
        organizationId: req.organizationId
      },
      data: {
        assignedUser,
        assignedUserId
      }
    });

    // 2. Update associated opportunities in PostgreSQL
    await prisma.opportunity.updateMany({
      where: {
        leadId: { in: ids },
        organizationId: req.organizationId
      },
      data: {
        assignedSalesperson: assignedUser,
        assignedSalespersonId: assignedUserId
      }
    });

    // 3. Ensure any leads in `ids` missing an opportunity get one created
    const existingOpps = await prisma.opportunity.findMany({
      where: { leadId: { in: ids }, organizationId: req.organizationId },
      select: { leadId: true }
    });
    const existingOppLeadIds = new Set(existingOpps.map(o => o.leadId));
    const missingLeads = leadsForEmail.filter(l => !existingOppLeadIds.has(l.id));

    if (missingLeads.length > 0) {
      await Promise.all(missingLeads.map(l =>
        prisma.opportunity.create({
          data: {
            organizationId: req.organizationId,
            leadId: l.id,
            customerName: l.contactName,
            company: l.company,
            email: l.email,
            phone: l.phone,
            dealValue: l.dealValue || 0,
            stage: l.status || 'New',
            assignedSalesperson: assignedUser,
            assignedSalespersonId: assignedUserId,
            createdAt: l.createdAt
          }
        }).catch(err => console.error("Create missing opp during bulk assign error:", err.message))
      ));
    }

    // Update associated customers in PostgreSQL
    const opps = await prisma.opportunity.findMany({
      where: { leadId: { in: ids }, organizationId: req.organizationId },
      select: { id: true }
    });
    const oppIds = opps.map(o => o.id);
    if (oppIds.length > 0) {
      await prisma.customer.updateMany({
        where: { opportunityId: { in: oppIds }, organizationId: req.organizationId },
        data: {
          assignedSalesperson: assignedUser,
          assignedSalespersonId: assignedUserId
        }
      });
    }

    // Send email notification
    if (assignedUserId) {
      const { sendLeadAssignmentEmail } = require('../services/leadEmailService');
      sendLeadAssignmentEmail(req, assignedUserId, leadsForEmail).catch(err => {
        console.error("Error sending bulk lead assign email:", err);
      });
    }
   
    await invalidateLeadCache(req.organizationId);
    res.status(200).json({ success: true, message: `Successfully assigned ${ids.length} leads`, updatedCount: updated.count });
  } catch (error) {
    console.error('Bulk assign leads error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createLead, getAllLeads, deleteLead, updateLead, importLeads, bulkAssignLeads
};