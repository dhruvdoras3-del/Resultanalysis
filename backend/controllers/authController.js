import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'cyberpunk-result-analysis-secret-key-2026!', {
    expiresIn: '30d'
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      res.status(400);
      throw new Error('Please provide username and password');
    }

    const users = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    if (users.length === 0) {
      res.status(401);
      throw new Error('Invalid username or password');
    }

    const user = users[0];

    if (user.status !== 'active') {
      res.status(401);
      throw new Error('Account is deactivated. Contact admin.');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid username or password');
    }

    // Retrieve name and code based on role
    let name = 'Administrator';
    let profileId = null;
    let deptId = null;
    let classId = null;

    if (user.role === 'faculty') {
      const fac = await db.query(
        'SELECT fp.id, fp.department_id, d.name as dept_name FROM faculty_profiles fp LEFT JOIN departments d ON fp.department_id = d.id WHERE fp.user_id = ?',
        [user.id]
      );
      if (fac.length > 0) {
        name = fac[0].dept_name ? `Faculty - ${fac[0].dept_name}` : 'Faculty Member';
        profileId = fac[0].id;
        deptId = fac[0].department_id;
      }
    } else if (user.role === 'student') {
      const stu = await db.query(
        'SELECT sp.id, sp.roll_number, sp.department_id, sp.class_id, u.username as student_name FROM student_profiles sp JOIN users u ON sp.user_id = u.id WHERE sp.user_id = ?',
        [user.id]
      );
      if (stu.length > 0) {
        name = stu[0].roll_number;
        profileId = stu[0].id;
        deptId = stu[0].department_id;
        classId = stu[0].class_id;
      }
    }

    // Log the audit
    await db.query(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [user.id, 'LOGIN', `User ${user.username} logged in successfully`, req.ip]
    );

    res.json({
      success: true,
      token: generateToken(user.id),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: name,
        profileId: profileId,
        departmentId: deptId,
        classId: classId
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res, next) => {
  try {
    const user = req.user;
    let profileData = {};

    if (user.role === 'faculty') {
      const profile = await db.query(
        'SELECT fp.*, d.name as department_name FROM faculty_profiles fp LEFT JOIN departments d ON fp.department_id = d.id WHERE fp.user_id = ?',
        [user.id]
      );
      profileData = profile[0] || {};
    } else if (user.role === 'student') {
      const profile = await db.query(
        'SELECT sp.*, d.name as department_name, c.name as class_name FROM student_profiles sp LEFT JOIN departments d ON sp.department_id = d.id LEFT JOIN classes c ON sp.class_id = c.id WHERE sp.user_id = ?',
        [user.id]
      );
      profileData = profile[0] || {};
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: profileData
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  const { email, phone, designation, dob } = req.body;
  const user = req.user;

  try {
    // Update email in users table
    if (email) {
      await db.query('UPDATE users SET email = ? WHERE id = ?', [email, user.id]);
    }

    if (user.role === 'faculty') {
      await db.query(
        'UPDATE faculty_profiles SET phone = ?, designation = ? WHERE user_id = ?',
        [phone || null, designation || null, user.id]
      );
    } else if (user.role === 'student') {
      await db.query(
        'UPDATE student_profiles SET phone = ?, dob = ? WHERE user_id = ?',
        [phone || null, dob || null, user.id]
      );
    }

    await db.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [user.id, 'PROFILE_UPDATE', `User ${user.username} updated profile details`]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password Request
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const users = await db.query('SELECT id, username FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      res.status(404);
      throw new Error('Email address not found');
    }

    // In a production app, we would send a token via email.
    // For this demonstration, we return a mock reset token.
    const user = users[0];
    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'cyberpunk-result-analysis-secret-key-2026!', {
      expiresIn: '10m'
    });

    res.json({
      success: true,
      message: 'Password reset link sent to email (Simulation). Use the token to reset your password.',
      token: resetToken // Exposing token for the UI to complete reset password seamlessly
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  const { password, token } = req.body;

  try {
    if (!password || !token) {
      res.status(400);
      throw new Error('Invalid token or password');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cyberpunk-result-analysis-secret-key-2026!');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, decoded.id]);

    await db.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [decoded.id, 'PASSWORD_RESET', 'Password was successfully reset']
    );

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }
};
