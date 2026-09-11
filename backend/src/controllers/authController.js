const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Client } = require("@microsoft/microsoft-graph-client");
require("isomorphic-fetch");
const { sendMail } = require("../services/mailService");
const prisma = require("../config/prisma");
const {
    getAuthUrl,
    getTokenFromCode
} = require("../services/graphService");
const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'myrefreshsecretkey';
const {
  checkLicenseAvailability,
} = require("../services/licenseService");
// 1. Check if first-run setup is required
exports.setupStatus = async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({ setupRequired: userCount === 0 });
  } catch (err) {
    console.error('Setup status check error:', err);
    res.status(500).json({ message: 'Database status check failed' });
  }
};

// 2. Perform initial Super Admin setup
exports.setup = async (req, res) => {
  try {
    const { companyName, companyEmail, name, email, password } = req.body;
    
    // Safety check: only allow if database is empty
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return res.status(400).json({ message: 'Initial setup has already been completed' });
    }

    if (!name || !email || !password || !companyName || !companyEmail) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Super Admin user
    const superAdmin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        status: 'Active'
      }
    });

   const inviter = req.user;

    const organizationId = inviter.organizationId;

const license = await checkLicenseAvailability(organizationId);

if (!license.allowed) {
  return res.status(403).json({
    success: false,
    message: license.message,
  });
}



    // Create default company settings
    await prisma.companySettings.create({
      data: {
        companyName,
        email: companyEmail
      }
    });

  
    const defaultStages = [
      { name: 'New', order: 1 },
      { name: 'Possible Response Received', order: 2 },
      { name: 'Discussion', order: 3 },
      { name: 'Proposal Preparation', order: 4 },
      { name: 'Negotiation', order: 5 },
      { name: 'Won', order: 6 },
      { name: 'Lost', order: 7 }
    ];


    const defaultRefStages = [
      { name: 'Referral Submitted', sequence: 1 },
      { name: 'Qualified', sequence: 2 },
      { name: 'Proposal', sequence: 3 },
      { name: 'Won', sequence: 4 },
      { name: 'Reward Approved', sequence: 5 }
    ];

   
    const { password: _, ...userWithoutPassword } = superAdmin;
    res.status(201).json({ user: userWithoutPassword, message: 'Super Admin and Organization created successfully' });
  } catch (err) {
    console.error('Setup error:', err);
    res.status(500).json({ message: err.message });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // First check normal CRM User
    let user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail
      }
    });

    // If not found in User table, check SuperAdmin table
    if (!user) {
      const superAdmin = await prisma.superAdmin.findUnique({
        where: {
          email: normalizedEmail
        }
      });

      if (!superAdmin) {
        return res.status(401).json({
          message: "Invalid email or password"
        });
      }

      // Check SuperAdmin password
      const isMatch = await bcrypt.compare(
        password,
        superAdmin.password
      );

      if (!isMatch) {
        return res.status(401).json({
          message: "Invalid email or password"
        });
      }

      // Check SuperAdmin status
      if (superAdmin.status === "Inactive") {
        return res.status(403).json({
          message: "Your account is deactivated"
        });
      }

      // Create access token for SuperAdmin
      const accessToken = jwt.sign(
        {
          userId: superAdmin.id,
          email: superAdmin.email,
          role: "SUPER_ADMIN",
          organizationId: superAdmin.organizationId
        },
        JWT_SECRET,
        {
          expiresIn: "15m"
        }
      );

      // Create refresh token
      const refreshToken = jwt.sign(
        {
          userId: superAdmin.id
        },
        JWT_REFRESH_SECRET,
        {
          expiresIn: "7d"
        }
      );

      // Save refresh token
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // IMPORTANT:
      // Your current refreshToken table expects a User ID.
      // We will handle this separately if your schema does not
      // allow SuperAdmin IDs here.

      const isProduction = process.env.NODE_ENV === "production";

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "None" : "Lax",
        maxAge: 15 * 60 * 1000
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "None" : "Lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.json({
        user: {
          id: superAdmin.id,
          name: superAdmin.name,
          email: superAdmin.email,
          role: "SUPER_ADMIN",
          organizationId: superAdmin.organizationId,
          status: superAdmin.status
        },
        accessToken,
        token: accessToken,
        refreshToken,
        organizationId: superAdmin.organizationId
      });
    }

    // -----------------------------
    // NORMAL CRM USER LOGIN
    // -----------------------------

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
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

    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
      },
      JWT_SECRET,
      {
        expiresIn: "15m"
      }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id
      },
      JWT_REFRESH_SECRET,
      {
        expiresIn: "7d"
      }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt
      }
    });

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      maxAge: 15 * 60 * 1000
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      user: userWithoutPassword,
      accessToken,
      token: accessToken,
      refreshToken,
      organizationId: user.organizationId
    });

  } catch (err) {
    console.error("Login error:", err);

    return res.status(500).json({
      message: err.message
    });
  }
};


exports.refresh = async (req, res) => {
  try {
    let token = req.cookies ? req.cookies.refreshToken : null;
    if (!token && req.body) {
      token = req.body.refreshToken;
    }

    if (!token) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

   
    const dbToken = await prisma.refreshToken.findUnique({ where: { token } });
    if (!dbToken) {
     
      const decoded = jwt.decode(token);
      if (decoded && decoded.userId) {
        await prisma.refreshToken.deleteMany({ where: { userId: decoded.userId } });
      }
      return res.status(403).json({ message: 'Invalid or reused refresh token' });
    }


    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.status === 'Inactive' || user.isLocked) {
      return res.status(401).json({ message: 'User unauthorized' });
    }

   
    await prisma.refreshToken.delete({ where: { id: dbToken.id } });

 
   const nextAccessToken = jwt.sign(
  {
    userId: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId
  },
  JWT_SECRET,
  { expiresIn: '15m' }
);

    const nextRefreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.refreshToken.create({
      data: {
        token: nextRefreshToken,
        userId: user.id,
        expiresAt
      }
    });

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', nextAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'None' : 'lax',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', nextRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'None' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};


exports.logout = async (req, res) => {
  try {
    let token = req.cookies ? req.cookies.refreshToken : null;
    if (!token && req.body) {
      token = req.body.refreshToken;
    }

    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } });
    }

    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "lax",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "lax",
    });

    // Destroy the express session to disconnect Outlook/email
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session during logout:", err);
        }
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Logout failed' });
  }
 
};


exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    
    await prisma.refreshToken.deleteMany({ where: { userId } });

    res.json({ message: 'Password updated successfully. Please log in again.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    console.log("1. forgotPassword API called");

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    console.log("2. Email received:", email);

    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase().trim(),
      },
    });

    console.log("3. User lookup completed");

    if (!user) {
      console.log("4. User not found");
      return res.json({
        success: true,
        message: "If an account exists, an OTP has been sent.",
      });
    }

    console.log("5. User found:", user.email);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetOtp: otp,
        resetOtpExpiry: expiry,
      },
    });

    console.log("6. OTP saved in database");

    try {
      console.log("7. Calling sendMail()");

      await sendMail({
        to: user.email,
        subject: "CRM Password Reset OTP",
        html: `
          <h2>Password Reset</h2>
          <p>Hello ${user.name},</p>
          <p>Your OTP is:</p>
          <h1>${otp}</h1>
        `,
      });

      console.log("8. sendMail() completed");

      return res.json({
        success: true,
        message: "OTP sent successfully",
      });

    } catch (mailError) {
      console.log("9. sendMail() failed");
      console.error(mailError);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetOtp: null,
          resetOtpExpiry: null,
        },
      });

      throw mailError;
    }

  } catch (err) {
    console.log("10. Outer catch");
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase().trim(),
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (
      user.resetOtp !== otp ||
      !user.resetOtpExpiry ||
      user.resetOtpExpiry < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    res.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
const { email, otp, newPassword } = req.body;

if (!newPassword) {
  return res.status(400).json({
    success: false,
    message: "New password is required",
  });
}

if (newPassword.length < 8) {
  return res.status(400).json({
    success: false,
    message: "Password must be at least 8 characters long.",
  });
}

   if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase().trim(),
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (
      user.resetOtp !== otp ||
      !user.resetOtpExpiry ||
      user.resetOtpExpiry < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        resetOtp: null,
        resetOtpExpiry: null,
      },
    });

    // Log the user out from all devices
    await prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
      },
    });

    res.json({
      success: true,
      message: "Password reset successful",
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.inviteUser = async (req, res) => {
  try {
    const {
      name,
      email,
      role,
      salesTeamId,
      password,
      adminId
    } = req.body;

    const inviter = req.user;
    const organizationId = inviter.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is missing"
      });
    }

    if (!name || !email || !role || !password) {
      return res.status(400).json({
        message: "Name, email, role, and password are required"
      });
    }

    const inviterRole = (inviter.role || "")
      .toUpperCase()
      .replace(/[\s_]+/g, "_");

    const targetRole = (role || "")
      .toUpperCase()
      .replace(/[\s_]+/g, "_");

    if (inviterRole === "ADMIN" && targetRole === "ADMIN") {
      return res.status(403).json({
        message: "Admins cannot create other Admin accounts"
      });
    }

    // Determine assigned adminId
    let assignedAdminId = null;

    if (inviterRole === "ADMIN") {
      assignedAdminId = inviter.id;
    } else if (inviterRole === "SUPER_ADMIN") {
      assignedAdminId = adminId || null;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate name inside same organization
    const existingName = await prisma.user.findFirst({
      where: {
        organizationId,
        name: {
          equals: name.trim(),
          mode: "insensitive"
        }
      }
    });

    if (existingName) {
      return res.status(400).json({
        message: "User with this name already exists"
      });
    }

    // Check duplicate email
    const existing = await prisma.user.findUnique({
      where: {
        email: normalizedEmail
      }
    });

    if (existing) {
      return res.status(400).json({
        message: "User with this email already exists"
      });
    }

    // CHECK LICENSE
    const license = await checkLicenseAvailability(organizationId);

    if (!license.allowed) {
      return res.status(403).json({
        success: false,
        message: license.message,
        licenseCount: license.licenseCount,
        usedLicenses: license.usedLicenses,
        availableLicenses: license.availableLicenses
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        role,
        organizationId,
        salesTeamId: salesTeamId || null,
        password: hashedPassword,
        status: "Active",
        invitationToken: null,
        invitationExpires: null,
        adminId: assignedAdminId
      }
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        organizationId: newUser.organizationId
      },
      license: {
        licenseCount: license.licenseCount,
        usedLicenses: license.usedLicenses + 1,
        availableLicenses: license.availableLicenses - 1
      }
    });

  } catch (err) {
    console.error("Create user error:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


exports.acceptInvitation = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password required' });
    }

    const user = await prisma.user.findUnique({ where: { invitationToken: token } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid invitation token' });
    }

    if (new Date() > user.invitationExpires) {
      return res.status(400).json({ message: 'Invitation token has expired' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        status: 'Active',
        invitationToken: null,
        invitationExpires: null
      }
    });

    res.json({ message: 'Account activated successfully. You can now log in.' });
  } catch (err) {
    console.error('Accept invitation error:', err);
    res.status(500).json({ message: err.message });
  }
};


exports.outlookCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Authorization code is missing"
      });
    }

    let parsedState = {};
    let redirectPage = "emails";

    if (state) {
      try {
        parsedState = JSON.parse(state);

        if (parsedState.redirect) {
          redirectPage = parsedState.redirect;
        }
      } catch (error) {
        console.error(
          "Failed to parse Outlook OAuth state:",
          error.message
        );
      }
    }

    const userId =
      parsedState.userId ||
      req.session?.oauthUserId;

    const organizationId =
      parsedState.organizationId ||
      req.session?.oauthOrganizationId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is missing from Outlook authentication"
      });
    }

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is missing from Outlook authentication"
      });
    }

    // Exchange authorization code using THIS organization's credentials
    const token = await getTokenFromCode(
      code,
      organizationId
    );

    // Create Graph client
    const client = Client.init({
      authProvider: (done) => {
        done(null, token.accessToken);
      }
    });

    // Get connected Outlook account
    const me = await client.api("/me").get();

    const outlookEmail =
      me.mail || me.userPrincipalName;

    // Save Outlook tokens to this user
    await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        outlookAccessToken: token.accessToken,
        outlookRefreshToken: token.refreshToken,
        outlookEmail
      }
    });

    // Optional session storage
    if (req.session) {
      req.session.outlook = {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        email: outlookEmail
      };

      delete req.session.oauthRedirect;
      delete req.session.oauthUserId;
      delete req.session.oauthOrganizationId;
    }

    console.log(
      `Outlook connected: ${outlookEmail} for organization: ${organizationId}`
    );

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "http://localhost:3000";

    const redirectUrl =
      `${frontendUrl}/${redirectPage}?connected=true`;

    if (req.session) {
      return req.session.save((err) => {
        if (err) {
          console.error(
            "Session save failed:",
            err
          );
        }

        return res.redirect(redirectUrl);
      });
    }

    return res.redirect(redirectUrl);

  } catch (err) {
    console.error(
      "Outlook OAuth callback error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.outlookLogin = async (req, res) => {
  try {
    const redirect = req.query.redirect || "emails";

    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication failed"
      });
    }

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is missing"
      });
    }

    if (req.session) {
      req.session.oauthRedirect = redirect;
      req.session.oauthUserId = userId;
      req.session.oauthOrganizationId = organizationId;
    }

    const state = JSON.stringify({
      userId,
      organizationId,
      redirect
    });

    const url = await getAuthUrl(
      organizationId,
      state
    );

    return res.redirect(url);

  } catch (err) {
    console.error("Outlook login error:", err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};