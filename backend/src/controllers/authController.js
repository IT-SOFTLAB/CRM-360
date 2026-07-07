const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'myrefreshsecretkey';

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
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.status === 'Inactive') {
      return res.status(403).json({ message: 'Your account is deactivated' });
    }

    if (user.isLocked) {
      return res.status(403).json({ message: 'Your account is locked' });
    }

    
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
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

   
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 mins
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      user: userWithoutPassword,
      accessToken,
      refreshToken
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
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
      { userId: user.id, email: user.email, role: user.role },
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

    res.cookie('accessToken', nextAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', nextRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
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

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
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


exports.inviteUser = async (req, res) => {
  try {
    const { name, email, role, department, salesTeamId, category, password } = req.body;
    const inviter = req.user;

    if (!name || !email || !role || !password) {
      return res.status(400).json({ message: 'Name, email, role, and password are required' });
    }


    const inviterRole = (inviter.role || '').toUpperCase().replace(/[\s_]+/g, '_');
    const targetRole = (role || '').toUpperCase().replace(/[\s_]+/g, '_');

    if (inviterRole === 'ADMIN' && targetRole === 'ADMIN') {
      return res.status(403).json({ message: 'Admins cannot create other Admin accounts' });
    }

 
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role,
        department,
        salesTeamId: salesTeamId || null,
        category,
        password: hashedPassword, 
        status: 'Active',
        invitationToken: null,
        invitationExpires: null
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ message: err.message });
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


exports.callback = async (req, res) => {
  res.send('Outlook connection preserved successfully.');
};