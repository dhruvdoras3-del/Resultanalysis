import xlsx from 'xlsx';
import db from '../config/db.js';

// Grade Calculator Helper
const calculateGradeAndGpa = (total) => {
  if (total >= 90) return { grade: 'S', gpa: 10.0, status: 'pass' };
  if (total >= 80) return { grade: 'A', gpa: 9.0, status: 'pass' };
  if (total >= 70) return { grade: 'B', gpa: 8.0, status: 'pass' };
  if (total >= 60) return { grade: 'C', gpa: 7.0, status: 'pass' };
  if (total >= 50) return { grade: 'D', gpa: 6.0, status: 'pass' };
  if (total >= 40) return { grade: 'E', gpa: 5.0, status: 'pass' };
  return { grade: 'F', gpa: 0.0, status: 'fail' };
};

// @desc    Get Faculty Dashboard details
// @route   GET /api/faculty/dashboard
// @access  Private/Faculty
export const getFacultyDashboard = async (req, res, next) => {
  try {
    // Find Faculty Profile ID
    const facProfile = await db.query('SELECT id FROM faculty_profiles WHERE user_id = ?', [req.user.id]);
    if (facProfile.length === 0) {
      res.status(404);
      throw new Error('Faculty profile not found');
    }
    const facultyId = facProfile[0].id;

    // Get assigned courses
    const courses = await db.query(`
      SELECT sf.id, sf.subject_id, sf.class_id, s.name as subject_name, s.code as subject_code, c.name as class_name, s.credits
      FROM subject_faculty sf
      JOIN subjects s ON sf.subject_id = s.id
      JOIN classes c ON sf.class_id = c.id
      WHERE sf.faculty_id = ?
    `, [facultyId]);

    // Gather metrics for each course
    const courseStats = [];
    for (const course of courses) {
      const results = await db.query(
        "SELECT total_marks, status FROM results WHERE subject_id = ? AND semester_id = (SELECT semester_id FROM classes WHERE id = ?)",
        [course.subject_id, course.class_id]
      );
      
      const totalStudents = results.length;
      const passed = results.filter(r => r.status === 'pass').length;
      const passRate = totalStudents > 0 ? ((passed / totalStudents) * 100).toFixed(1) : 0;
      const averageMarks = totalStudents > 0 ? (results.reduce((acc, curr) => acc + parseFloat(curr.total_marks), 0) / totalStudents).toFixed(1) : 0;

      courseStats.push({
        ...course,
        totalStudents,
        passRate,
        averageMarks
      });
    }

    res.json({
      success: true,
      data: {
        courses: courseStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Students for entry based on Class & Subject
// @route   GET /api/faculty/students
// @access  Private/Faculty
export const getStudentsForMarks = async (req, res, next) => {
  const { classId, subjectId } = req.query;
  try {
    if (!classId || !subjectId) {
      res.status(400);
      throw new Error('Please select class and subject');
    }

    // Get active semester for the class
    const classInfo = await db.query('SELECT semester_id FROM classes WHERE id = ?', [classId]);
    if (classInfo.length === 0) {
      res.status(404);
      throw new Error('Class not found');
    }
    const semesterId = classInfo[0].semester_id;

    // Get students in the class
    const students = await db.query(`
      SELECT sp.id as student_id, sp.roll_number, u.username as name,
             r.id as result_id, r.internal_marks, r.external_marks, r.total_marks, r.grade, r.status,
             att.total_classes, att.attended_classes, att.percentage as attendance_percentage
      FROM student_profiles sp
      JOIN users u ON sp.user_id = u.id
      LEFT JOIN results r ON r.student_id = sp.id AND r.subject_id = ? AND r.semester_id = ?
      LEFT JOIN attendance att ON att.student_id = sp.id AND att.subject_id = ? AND att.semester_id = ?
      WHERE sp.class_id = ?
      ORDER BY sp.roll_number ASC
    `, [subjectId, semesterId, subjectId, semesterId, classId]);

    res.json({ success: true, data: students });
  } catch (error) {
    next(error);
  }
};

// @desc    Save/Update Marks
// @route   POST /api/faculty/marks
// @access  Private/Faculty
export const saveMarks = async (req, res, next) => {
  const { classId, subjectId, marksData } = req.body;
  try {
    if (!classId || !subjectId || !marksData || !Array.isArray(marksData)) {
      res.status(400);
      throw new Error('Missing parameters or invalid marks list');
    }

    const facProfile = await db.query('SELECT id FROM faculty_profiles WHERE user_id = ?', [req.user.id]);
    const facultyId = facProfile[0]?.id || null;

    const classInfo = await db.query('SELECT semester_id FROM classes WHERE id = ?', [classId]);
    const semesterId = classInfo[0].semester_id;

    for (const record of marksData) {
      const { studentId, internalMarks, externalMarks } = record;
      const total = parseFloat(internalMarks || 0) + parseFloat(externalMarks || 0);
      const { grade, gpa, status } = calculateGradeAndGpa(total);

      // Check if result already exists
      const existing = await db.query(
        'SELECT id FROM results WHERE student_id = ? AND subject_id = ? AND semester_id = ?',
        [studentId, subjectId, semesterId]
      );

      if (existing.length > 0) {
        // Update
        await db.query(
          `UPDATE results 
           SET internal_marks = ?, external_marks = ?, total_marks = ?, grade = ?, gpa = ?, status = ?, created_by = ? 
           WHERE id = ?`,
          [internalMarks, externalMarks, total, grade, gpa, status, facultyId, existing[0].id]
        );
      } else {
        // Insert
        await db.query(
          `INSERT INTO results (student_id, subject_id, semester_id, internal_marks, external_marks, total_marks, grade, gpa, status, exam_date, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [studentId, subjectId, semesterId, internalMarks, externalMarks, total, grade, gpa, status, new Date(), facultyId]
        );
      }

      // Re-trigger dynamic AI prediction calculations for this student
      await recalculateStudentAI(studentId);
    }

    res.json({ success: true, message: 'Marks updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Save Attendance records
// @route   POST /api/faculty/attendance
// @access  Private/Faculty
export const saveAttendance = async (req, res, next) => {
  const { classId, subjectId, attendanceData } = req.body;
  try {
    if (!classId || !subjectId || !attendanceData || !Array.isArray(attendanceData)) {
      res.status(400);
      throw new Error('Missing parameters or invalid attendance list');
    }

    const classInfo = await db.query('SELECT semester_id FROM classes WHERE id = ?', [classId]);
    const semesterId = classInfo[0].semester_id;

    for (const record of attendanceData) {
      const { studentId, totalClasses, attendedClasses } = record;
      const percentage = totalClasses > 0 ? ((attendedClasses / totalClasses) * 100).toFixed(2) : 0.00;

      const existing = await db.query(
        'SELECT id FROM attendance WHERE student_id = ? AND subject_id = ? AND semester_id = ?',
        [studentId, subjectId, semesterId]
      );

      if (existing.length > 0) {
        await db.query(
          'UPDATE attendance SET total_classes = ?, attended_classes = ?, percentage = ? WHERE id = ?',
          [totalClasses, attendedClasses, percentage, existing[0].id]
        );
      } else {
        await db.query(
          'INSERT INTO attendance (student_id, subject_id, semester_id, total_classes, attended_classes, percentage) VALUES (?, ?, ?, ?, ?, ?)',
          [studentId, subjectId, semesterId, totalClasses, attendedClasses, percentage]
        );
      }
      
      // Recompute AI predictions since attendance impacts risk levels
      await recalculateStudentAI(studentId);
    }

    res.json({ success: true, message: 'Attendance records updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload marks via Excel
// @route   POST /api/faculty/upload-marks
// @access  Private/Faculty
export const uploadMarksExcel = async (req, res, next) => {
  const { classId, subjectId } = req.body;
  try {
    if (!classId || !subjectId) {
      res.status(400);
      throw new Error('Class ID and Subject ID are required parameters');
    }
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload an Excel file');
    }

    const facProfile = await db.query('SELECT id FROM faculty_profiles WHERE user_id = ?', [req.user.id]);
    const facultyId = facProfile[0]?.id || null;

    const classInfo = await db.query('SELECT semester_id FROM classes WHERE id = ?', [classId]);
    const semesterId = classInfo[0].semester_id;

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);

    let count = 0;
    const errors = [];

    for (const [index, row] of rows.entries()) {
      const { rollNumber, internalMarks, externalMarks } = row;

      try {
        if (!rollNumber) {
          throw new Error(`Row ${index + 1}: Missing student roll number`);
        }

        // Fetch student profile ID
        const student = await db.query('SELECT id FROM student_profiles WHERE roll_number = ?', [rollNumber.toString()]);
        if (student.length === 0) {
          throw new Error(`Row ${index + 1}: Roll number '${rollNumber}' not found in database`);
        }
        const studentId = student[0].id;

        const internal = parseFloat(internalMarks || 0);
        const external = parseFloat(externalMarks || 0);
        const total = internal + external;
        const { grade, gpa, status } = calculateGradeAndGpa(total);

        // Save
        const existing = await db.query(
          'SELECT id FROM results WHERE student_id = ? AND subject_id = ? AND semester_id = ?',
          [studentId, subjectId, semesterId]
        );

        if (existing.length > 0) {
          await db.query(
            `UPDATE results 
             SET internal_marks = ?, external_marks = ?, total_marks = ?, grade = ?, gpa = ?, status = ?, created_by = ? 
             WHERE id = ?`,
            [internal, external, total, grade, gpa, status, facultyId, existing[0].id]
          );
        } else {
          await db.query(
            `INSERT INTO results (student_id, subject_id, semester_id, internal_marks, external_marks, total_marks, grade, gpa, status, exam_date, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [studentId, subjectId, semesterId, internal, external, total, grade, gpa, status, new Date(), facultyId]
          );
        }

        await recalculateStudentAI(studentId);
        count++;
      } catch (err) {
        errors.push(err.message);
      }
    }

    res.json({
      success: true,
      message: `Marks uploaded successfully for ${count} students.`,
      errors
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Subject-wise Analysis
// @route   GET /api/faculty/course-analytics
// @access  Private/Faculty
export const getCourseAnalytics = async (req, res, next) => {
  const { classId, subjectId } = req.query;
  try {
    if (!classId || !subjectId) {
      res.status(400);
      throw new Error('Class ID and Subject ID are required');
    }

    // Get active semester
    const classInfo = await db.query('SELECT semester_id FROM classes WHERE id = ?', [classId]);
    const semesterId = classInfo[0].semester_id;

    // Get grades distribution
    const gradesDist = await db.query(
      `SELECT grade, COUNT(*) as count 
       FROM results 
       WHERE class_id = (SELECT class_id FROM student_profiles WHERE id = results.student_id) 
         AND subject_id = ? AND semester_id = ? 
       GROUP BY grade`,
      [subjectId, semesterId]
    );

    // We can also run a cleaner query joining profiles:
    const grades = await db.query(`
      SELECT r.grade, COUNT(*) as count 
      FROM results r
      JOIN student_profiles sp ON r.student_id = sp.id
      WHERE sp.class_id = ? AND r.subject_id = ? AND r.semester_id = ?
      GROUP BY r.grade
    `, [classId, subjectId, semesterId]);

    // Toppers
    const toppers = await db.query(`
      SELECT sp.roll_number, u.username as name, r.total_marks, r.grade
      FROM results r
      JOIN student_profiles sp ON r.student_id = sp.id
      JOIN users u ON sp.user_id = u.id
      WHERE sp.class_id = ? AND r.subject_id = ? AND r.semester_id = ?
      ORDER BY r.total_marks DESC
      LIMIT 5
    `, [classId, subjectId, semesterId]);

    // Stats
    const stats = await db.query(`
      SELECT AVG(r.total_marks) as avg_score, MAX(r.total_marks) as max_score, MIN(r.total_marks) as min_score
      FROM results r
      JOIN student_profiles sp ON r.student_id = sp.id
      WHERE sp.class_id = ? AND r.subject_id = ? AND r.semester_id = ?
    `, [classId, subjectId, semesterId]);

    res.json({
      success: true,
      data: {
        toppers,
        grades: grades,
        summary: stats[0] || { avg_score: 0, max_score: 0, min_score: 0 }
      }
    });
  } catch (error) {
    next(error);
  }
};

// AI Re-calculator helper called on results/attendance changes
async function recalculateStudentAI(studentId) {
  try {
    const student = await db.query(
      "SELECT sp.id, sp.roll_number, u.username as name, sp.department_id FROM student_profiles sp JOIN users u ON sp.user_id = u.id WHERE sp.id = ?",
      [studentId]
    );
    if (student.length === 0) return;
    const { department_id, name } = student[0];

    const results = await db.query("SELECT r.*, s.name as subject_name, s.credits FROM results r JOIN subjects s ON r.subject_id = s.id WHERE r.student_id = ?", [studentId]);
    const attendance = await db.query("SELECT percentage FROM attendance WHERE student_id = ?", [studentId]);

    if (results.length === 0) return;

    let totalGpaPoints = 0;
    let totalCredits = 0;
    const weakSubjects = [];

    for (const r of results) {
      totalGpaPoints += r.gpa * r.credits;
      totalCredits += r.credits;
      if (r.status === 'fail' || r.total_marks < 55) {
        weakSubjects.push(r.subject_name);
      }
    }

    const finalGpa = totalCredits > 0 ? (totalGpaPoints / totalCredits) : 0.00;
    
    let overallAttendance = 0;
    if (attendance.length > 0) {
      overallAttendance = attendance.reduce((acc, curr) => acc + parseFloat(curr.percentage), 0) / attendance.length;
    }

    // Risk level estimation
    let riskLevel = 'low';
    if (finalGpa < 5.5 || overallAttendance < 75) {
      riskLevel = 'high';
    } else if (finalGpa < 7.0 || overallAttendance < 82) {
      riskLevel = 'medium';
    }

    const predictedGpa = (finalGpa + (overallAttendance > 85 ? 0.35 : -0.25)).toFixed(2);

    let careers = ['Software Engineer', 'Systems Analyst'];
    if (department_id === 2) {
      careers = ['Embedded Specialist', 'VLSI Design Engineer', 'IoT Architect'];
    } else {
      careers = ['Full-Stack Architect', 'Machine Learning Engineer', 'DevOps Developer'];
    }

    let studyPlan = `### AI Recommended Study Plan for ${name}
1. **Focus Area**: Devote 3 hours/week to ${weakSubjects.length > 0 ? weakSubjects.join(', ') : 'Advanced Concepts'}.
2. **Attendance Improvement**: Current attendance is ${overallAttendance.toFixed(1)}%. Attend regular sessions to cross 85%.
3. **Practice**: Complete 2 coding/practical mock tests weekly.
4. **Peer Group**: Join study sessions with top performers in class.`;

    await db.query(
      `INSERT INTO student_predictions (student_id, predicted_gpa, risk_level, weak_subjects, career_recommendations, study_plan)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         predicted_gpa = VALUES(predicted_gpa),
         risk_level = VALUES(risk_level),
         weak_subjects = VALUES(weak_subjects),
         career_recommendations = VALUES(career_recommendations),
         study_plan = VALUES(study_plan)`,
      [
        studentId,
        predictedGpa,
        riskLevel,
        JSON.stringify(weakSubjects),
        JSON.stringify(careers),
        studyPlan
      ]
    );
  } catch (err) {
    // If SQLite, ON DUPLICATE KEY will fail, so let's write an adapter check
    try {
      const exists = await db.query('SELECT id FROM student_predictions WHERE student_id = ?', [studentId]);
      if (exists.length > 0) {
        await db.query(
          `UPDATE student_predictions 
           SET predicted_gpa = ?, risk_level = ?, weak_subjects = ?, career_recommendations = ?, study_plan = ? 
           WHERE student_id = ?`,
          [
            (finalGpa + (overallAttendance > 85 ? 0.35 : -0.25)).toFixed(2),
            riskLevel,
            JSON.stringify(weakSubjects),
            JSON.stringify(careers),
            studyPlan,
            studentId
          ]
        );
      } else {
        await db.query(
          `INSERT INTO student_predictions (student_id, predicted_gpa, risk_level, weak_subjects, career_recommendations, study_plan)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            studentId,
            (finalGpa + (overallAttendance > 85 ? 0.35 : -0.25)).toFixed(2),
            riskLevel,
            JSON.stringify(weakSubjects),
            JSON.stringify(careers),
            studyPlan
          ]
        );
      }
    } catch (sqliteErr) {
      console.error('Error updating AI Predictions table:', sqliteErr.message);
    }
  }
}
