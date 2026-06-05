import bcrypt from 'bcryptjs';
import xlsx from 'xlsx';
import db from '../config/db.js';

// @desc    Get Admin System Statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getStats = async (req, res, next) => {
  try {
    const studentsCount = await db.query("SELECT COUNT(*) as count FROM student_profiles");
    const facultyCount = await db.query("SELECT COUNT(*) as count FROM faculty_profiles");
    const deptsCount = await db.query("SELECT COUNT(*) as count FROM departments");
    const classesCount = await db.query("SELECT COUNT(*) as count FROM classes");
    const subjectsCount = await db.query("SELECT COUNT(*) as count FROM subjects");
    
    // Average GPA
    const avgGpaRes = await db.query("SELECT AVG(gpa) as avg_gpa FROM results WHERE status = 'pass'");
    const avgGpa = parseFloat(avgGpaRes[0]?.avg_gpa || 0).toFixed(2);

    // Pass / Fail Ratio
    const passFailRes = await db.query(
      "SELECT status, COUNT(*) as count FROM results GROUP BY status"
    );
    const passCount = passFailRes.find(r => r.status === 'pass')?.count || 0;
    const failCount = passFailRes.find(r => r.status === 'fail')?.count || 0;
    const totalResults = passCount + failCount;
    const passPercentage = totalResults > 0 ? ((passCount / totalResults) * 100).toFixed(1) : 0;

    // Recent Audit Logs
    const recentLogs = await db.query(
      "SELECT al.*, u.username FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id ORDER BY al.created_at DESC LIMIT 5"
    );

    // Department-wise Student count
    const deptDistribution = await db.query(
      "SELECT d.code, COUNT(s.id) as count FROM departments d LEFT JOIN student_profiles s ON d.id = s.department_id GROUP BY d.id"
    );

    res.json({
      success: true,
      data: {
        counts: {
          students: studentsCount[0]?.count || 0,
          faculty: facultyCount[0]?.count || 0,
          departments: deptsCount[0]?.count || 0,
          classes: classesCount[0]?.count || 0,
          subjects: subjectsCount[0]?.count || 0
        },
        gpa: avgGpa,
        passPercentage,
        recentLogs,
        deptDistribution
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// STUDENT MANAGEMENT
// ==========================================

export const getStudents = async (req, res, next) => {
  const { departmentId, classId, search } = req.query;
  try {
    let sql = `
      SELECT sp.*, u.username, u.email, u.status, d.name as department_name, c.name as class_name 
      FROM student_profiles sp
      JOIN users u ON sp.user_id = u.id
      JOIN departments d ON sp.department_id = d.id
      LEFT JOIN classes c ON sp.class_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (departmentId) {
      sql += ' AND sp.department_id = ?';
      params.push(departmentId);
    }
    if (classId) {
      sql += ' AND sp.class_id = ?';
      params.push(classId);
    }
    if (search) {
      sql += ' AND (u.username LIKE ? OR sp.roll_number LIKE ? OR u.email LIKE ?)';
      const keyword = `%${search}%`;
      params.push(keyword, keyword, keyword);
    }

    sql += ' ORDER BY sp.roll_number ASC';
    const students = await db.query(sql, params);
    
    res.json({ success: true, data: students });
  } catch (error) {
    next(error);
  }
};

export const addStudent = async (req, res, next) => {
  const { username, email, password, rollNumber, departmentId, classId, semesterId, phone, dob } = req.body;
  try {
    // Check if user exists
    const existingUser = await db.query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUser.length > 0) {
      res.status(400);
      throw new Error('Username or Email already exists');
    }

    // Check if roll number exists
    const existingRoll = await db.query('SELECT id FROM student_profiles WHERE roll_number = ?', [rollNumber]);
    if (existingRoll.length > 0) {
      res.status(400);
      throw new Error('Roll number already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'student123', salt);

    // Create User
    const userRes = await db.query(
      'INSERT INTO users (username, password, email, role, status) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, email, 'student', 'active']
    );
    const userId = userRes.insertId;

    // Create Student Profile
    await db.query(
      'INSERT INTO student_profiles (user_id, roll_number, department_id, class_id, semester_id, phone, dob, enrollment_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, rollNumber, departmentId, classId || null, semesterId || null, phone || null, dob || null, new Date()]
    );

    // Seed AI Prediction defaults
    const studentRes = await db.query('SELECT id FROM student_profiles WHERE user_id = ?', [userId]);
    const studentId = studentRes[0].id;
    await db.query(
      'INSERT INTO student_predictions (student_id, predicted_gpa, risk_level, weak_subjects, career_recommendations, study_plan) VALUES (?, 0.0, "low", "[]", "[]", "No analytical data available yet.")',
      [studentId]
    );

    await db.query('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)', [
      req.user.id,
      'ADD_STUDENT',
      `Added student ${username} (${rollNumber})`
    ]);

    res.status(201).json({ success: true, message: 'Student created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateStudent = async (req, res, next) => {
  const { id } = req.params; // Profile ID
  const { email, classId, semesterId, phone, dob, status } = req.body;
  try {
    const student = await db.query('SELECT user_id, roll_number FROM student_profiles WHERE id = ?', [id]);
    if (student.length === 0) {
      res.status(404);
      throw new Error('Student profile not found');
    }
    const userId = student[0].user_id;

    if (email) {
      await db.query('UPDATE users SET email = ? WHERE id = ?', [email, userId]);
    }
    if (status) {
      await db.query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
    }

    await db.query(
      'UPDATE student_profiles SET class_id = ?, semester_id = ?, phone = ?, dob = ? WHERE id = ?',
      [classId || null, semesterId || null, phone || null, dob || null, id]
    );

    await db.query('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)', [
      req.user.id,
      'UPDATE_STUDENT',
      `Updated student profile: Roll No ${student[0].roll_number}`
    ]);

    res.json({ success: true, message: 'Student updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteStudent = async (req, res, next) => {
  const { id } = req.params; // Profile ID
  try {
    const student = await db.query('SELECT user_id, roll_number FROM student_profiles WHERE id = ?', [id]);
    if (student.length === 0) {
      res.status(404);
      throw new Error('Student profile not found');
    }
    
    // Delete user (cascades to profile)
    await db.query('DELETE FROM users WHERE id = ?', [student[0].user_id]);

    await db.query('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)', [
      req.user.id,
      'DELETE_STUDENT',
      `Deleted student Roll No ${student[0].roll_number}`
    ]);

    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// FACULTY MANAGEMENT
// ==========================================

export const getFaculty = async (req, res, next) => {
  const { departmentId, search } = req.query;
  try {
    let sql = `
      SELECT fp.*, u.username, u.email, u.status, d.name as department_name 
      FROM faculty_profiles fp
      JOIN users u ON fp.user_id = u.id
      LEFT JOIN departments d ON fp.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (departmentId) {
      sql += ' AND fp.department_id = ?';
      params.push(departmentId);
    }
    if (search) {
      sql += ' AND (u.username LIKE ? OR u.email LIKE ? OR fp.designation LIKE ?)';
      const keyword = `%${search}%`;
      params.push(keyword, keyword, keyword);
    }

    sql += ' ORDER BY u.username ASC';
    const faculty = await db.query(sql, params);
    
    res.json({ success: true, data: faculty });
  } catch (error) {
    next(error);
  }
};

export const addFaculty = async (req, res, next) => {
  const { username, email, password, departmentId, designation, phone } = req.body;
  try {
    const existingUser = await db.query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUser.length > 0) {
      res.status(400);
      throw new Error('Username or Email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'faculty123', salt);

    // User
    const userRes = await db.query(
      'INSERT INTO users (username, password, email, role, status) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, email, 'faculty', 'active']
    );
    const userId = userRes.insertId;

    // Faculty Profile
    await db.query(
      'INSERT INTO faculty_profiles (user_id, department_id, designation, phone) VALUES (?, ?, ?, ?)',
      [userId, departmentId || null, designation || 'Assistant Professor', phone || null]
    );

    await db.query('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)', [
      req.user.id,
      'ADD_FACULTY',
      `Added faculty member ${username}`
    ]);

    res.status(201).json({ success: true, message: 'Faculty created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateFaculty = async (req, res, next) => {
  const { id } = req.params; // Profile ID
  const { email, departmentId, designation, phone, status } = req.body;
  try {
    const faculty = await db.query('SELECT user_id, id FROM faculty_profiles WHERE id = ?', [id]);
    if (faculty.length === 0) {
      res.status(404);
      throw new Error('Faculty profile not found');
    }
    const userId = faculty[0].user_id;

    if (email) {
      await db.query('UPDATE users SET email = ? WHERE id = ?', [email, userId]);
    }
    if (status) {
      await db.query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
    }

    await db.query(
      'UPDATE faculty_profiles SET department_id = ?, designation = ?, phone = ? WHERE id = ?',
      [departmentId || null, designation || null, phone || null, id]
    );

    res.json({ success: true, message: 'Faculty updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteFaculty = async (req, res, next) => {
  const { id } = req.params;
  try {
    const faculty = await db.query('SELECT user_id FROM faculty_profiles WHERE id = ?', [id]);
    if (faculty.length === 0) {
      res.status(404);
      throw new Error('Faculty not found');
    }

    await db.query('DELETE FROM users WHERE id = ?', [faculty[0].user_id]);

    res.json({ success: true, message: 'Faculty deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ACADEMICS MANAGEMENT (DEPARTMENTS, CLASSES, SUBJECTS, SEMESTERS)
// ==========================================

export const getAcademics = async (req, res, next) => {
  try {
    const depts = await db.query('SELECT * FROM departments ORDER BY name ASC');
    const classes = await db.query(`
      SELECT c.*, d.name as department_name, s.name as semester_name, s.academic_year 
      FROM classes c
      JOIN departments d ON c.department_id = d.id
      JOIN semesters s ON c.semester_id = s.id
      ORDER BY c.name ASC
    `);
    const subjects = await db.query(`
      SELECT s.*, d.name as department_name FROM subjects s
      JOIN departments d ON s.department_id = d.id
      ORDER BY s.name ASC
    `);
    const semesters = await db.query('SELECT * FROM semesters ORDER BY academic_year DESC, name ASC');

    res.json({
      success: true,
      data: { departments: depts, classes, subjects, semesters }
    });
  } catch (error) {
    next(error);
  }
};

export const addDepartment = async (req, res, next) => {
  const { name, code } = req.body;
  try {
    await db.query('INSERT INTO departments (name, code) VALUES (?, ?)', [name, code]);
    res.status(201).json({ success: true, message: 'Department created successfully' });
  } catch (error) {
    next(error);
  }
};

export const addClass = async (req, res, next) => {
  const { name, departmentId, semesterId } = req.body;
  try {
    await db.query('INSERT INTO classes (name, department_id, semester_id) VALUES (?, ?, ?)', [name, departmentId, semesterId]);
    res.status(201).json({ success: true, message: 'Class created successfully' });
  } catch (error) {
    next(error);
  }
};

export const addSubject = async (req, res, next) => {
  const { name, code, departmentId, credits } = req.body;
  try {
    await db.query('INSERT INTO subjects (name, code, department_id, credits) VALUES (?, ?, ?, ?)', [name, code, departmentId, credits]);
    res.status(201).json({ success: true, message: 'Subject created successfully' });
  } catch (error) {
    next(error);
  }
};

export const addSemester = async (req, res, next) => {
  const { name, academicYear, status } = req.body;
  try {
    // If setting active, set all others to inactive
    if (status === 'active') {
      await db.query("UPDATE semesters SET status = 'inactive'");
    }
    await db.query('INSERT INTO semesters (name, academic_year, status) VALUES (?, ?, ?)', [name, academicYear, status || 'inactive']);
    res.status(201).json({ success: true, message: 'Semester created successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// SUBJECT FACULTY ASSIGNMENTS
// ==========================================

export const getAssignments = async (req, res, next) => {
  try {
    const list = await db.query(`
      SELECT sf.id, sf.subject_id, sf.faculty_id, sf.class_id,
             s.name as subject_name, s.code as subject_code,
             u.username as faculty_name,
             c.name as class_name, d.name as department_name
      FROM subject_faculty sf
      JOIN subjects s ON sf.subject_id = s.id
      JOIN faculty_profiles fp ON sf.faculty_id = fp.id
      JOIN users u ON fp.user_id = u.id
      JOIN classes c ON sf.class_id = c.id
      JOIN departments d ON c.department_id = d.id
      ORDER BY c.name ASC, s.name ASC
    `);
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

export const assignSubjectFaculty = async (req, res, next) => {
  const { subjectId, facultyId, classId } = req.body;
  try {
    // SQLite uses INSERT OR IGNORE, MySQL uses INSERT IGNORE.
    // To make it cross-compatible, we check for existence first.
    const exists = await db.query(
      'SELECT id FROM subject_faculty WHERE subject_id = ? AND faculty_id = ? AND class_id = ?',
      [subjectId, facultyId, classId]
    );

    if (exists.length > 0) {
      res.status(400);
      throw new Error('This subject is already assigned to the faculty for this class');
    }

    await db.query(
      'INSERT INTO subject_faculty (subject_id, faculty_id, class_id) VALUES (?, ?, ?)',
      [subjectId, facultyId, classId]
    );

    res.status(201).json({ success: true, message: 'Subject assigned successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteAssignment = async (req, res, next) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM subject_faculty WHERE id = ?', [id]);
    res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CSV/EXCEL IMPORT DATA
// ==========================================

export const importStudents = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload an Excel or CSV file');
    }

    // Read sheet
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      res.status(400);
      throw new Error('The uploaded file contains no data rows');
    }

    let successCount = 0;
    let errors = [];
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('student123', salt);

    for (const [index, row] of rows.entries()) {
      const { username, email, rollNumber, departmentCode, className, semesterName, academicYear, phone, dob } = row;

      try {
        if (!username || !email || !rollNumber || !departmentCode) {
          throw new Error(`Row ${index + 1}: Missing mandatory fields (username, email, rollNumber, departmentCode)`);
        }

        // Fetch Department ID
        const dept = await db.query('SELECT id FROM departments WHERE code = ?', [departmentCode]);
        if (dept.length === 0) {
          throw new Error(`Row ${index + 1}: Department code '${departmentCode}' does not exist`);
        }
        const departmentId = dept[0].id;

        // Fetch Semester ID if provided
        let semesterId = null;
        if (semesterName && academicYear) {
          const sem = await db.query('SELECT id FROM semesters WHERE name = ? AND academic_year = ?', [semesterName, academicYear]);
          if (sem.length > 0) semesterId = sem[0].id;
        }

        // Fetch Class ID if provided
        let classId = null;
        if (className) {
          const cls = await db.query('SELECT id FROM classes WHERE name = ? AND department_id = ?', [className, departmentId]);
          if (cls.length > 0) classId = cls[0].id;
        }

        // Check if user/roll exists
        const userExists = await db.query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
        if (userExists.length > 0) {
          throw new Error(`Row ${index + 1}: Username/Email already exists`);
        }
        const rollExists = await db.query('SELECT id FROM student_profiles WHERE roll_number = ?', [rollNumber]);
        if (rollExists.length > 0) {
          throw new Error(`Row ${index + 1}: Roll number already exists`);
        }

        // Create User
        const userRes = await db.query(
          'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
          [username, defaultPassword, email, 'student']
        );
        const userId = userRes.insertId;

        // Profile
        await db.query(
          'INSERT INTO student_profiles (user_id, roll_number, department_id, class_id, semester_id, phone, dob, enrollment_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [userId, rollNumber.toString(), departmentId, classId, semesterId, phone?.toString() || null, dob || null, new Date()]
        );

        // Seeder Prediction defaults
        const studentRes = await db.query('SELECT id FROM student_profiles WHERE user_id = ?', [userId]);
        await db.query(
          'INSERT INTO student_predictions (student_id, predicted_gpa, risk_level, weak_subjects, career_recommendations, study_plan) VALUES (?, 0.0, "low", "[]", "[]", "No analytical data available yet.")',
          [studentRes[0].id]
        );

        successCount++;
      } catch (err) {
        errors.push(err.message);
      }
    }

    await db.query('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)', [
      req.user.id,
      'IMPORT_STUDENTS',
      `Imported students: ${successCount} successful, ${errors.length} errors`
    ]);

    res.json({
      success: true,
      message: `Imported ${successCount} students successfully. Errors: ${errors.length}`,
      errors
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// AUDIT LOGS
// ==========================================

export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await db.query(`
      SELECT al.*, u.username, u.role 
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 100
    `);
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};
