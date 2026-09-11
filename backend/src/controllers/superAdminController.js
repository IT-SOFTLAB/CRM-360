const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");

exports.createSuperAdmin = async (req, res) => {
  try {
    const {
      organizationId,
      name,
      email,
      password,
       License_count,
      startDate,
      endDate,
    } = req.body;

    // 1. Validate required fields
    if (
      !organizationId ||
      !name ||
      !email ||
      !password ||
 License_count === undefined||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "organizationId, name, email, password, noOfLicenses, startDate and endDate are required",
      });
    }

    // 2. Validate license count
    if (!Number.isInteger(Number(License_count)) || Number(License_count) <= 0) {
      return res.status(400).json({
        success: false,
        message: "noOfLicenses must be a positive integer",
      });
    }

    // 3. Validate dates
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (
      Number.isNaN(parsedStartDate.getTime()) ||
      Number.isNaN(parsedEndDate.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid startDate or endDate",
      });
    }

    if (parsedEndDate <= parsedStartDate) {
      return res.status(400).json({
        success: false,
        message: "endDate must be after startDate",
      });
    }

    // 4. Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // 5. Check if Super Admin email already exists
    const existingSuperAdmin = await prisma.superAdmin.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingSuperAdmin) {
      return res.status(409).json({
        success: false,
        message: "Super Admin with this email already exists",
      });
    }

    // 6. Hash password using existing project approach
    const hashedPassword = await bcrypt.hash(password, 10);

    // 7. Create Super Admin
    const superAdmin = await prisma.superAdmin.create({
      data: {
        organizationId: organizationId.trim(),
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
       License_count: Number(License_count),
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        status: "Active",
      },
    });

    // 8. Never return password
    const { password: _, ...superAdminWithoutPassword } = superAdmin;

    return res.status(201).json({
      success: true,
      message: "Super Admin created successfully",
      superAdmin: superAdminWithoutPassword,
    });
  } catch (err) {
  console.error("Create Super Admin error:", err);

  return res.status(500).json({
    success: false,
    message: err.message,
    error: err.code || null,
  });
  }
};