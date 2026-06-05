import db from '../config/db.js';

// @desc    Get Student Dashboard Analytics
// @route   GET /api/student/dashboard
// @access  Private/Student
export const getStudentDashboard = async (req, res, next) => {
  try {
    // 1. Fetch student profile
    const profiles = await db.query(
      `SELECT sp.*, u.username as name, u.email, d.name as department_name, c.name as class_name, sem.name as semester_name
       FROM student_profiles sp
       JOIN users u ON sp.user_id = u.id
       JOIN departments d ON sp.department_id = d.id
       LEFT JOIN classes c ON sp.class_id = c.id
       LEFT JOIN semesters sem ON sp.semester_id = sem.id
       WHERE sp.user_id = ?`,
      [req.user.id]
    );

    if (profiles.length === 0) {
      res.status(404);
      throw new Error('Student profile not found');
    }

    const student = profiles[0];
    const studentId = student.id;
    const classId = student.class_id;

    // 2. Fetch subject-wise results
    const results = await db.query(
      `SELECT r.id, r.internal_marks, r.external_marks, r.total_marks, r.grade, r.gpa, r.status,
              s.name as subject_name, s.code as subject_code, s.credits, sem.name as semester_name
       FROM results r
       JOIN subjects s ON r.subject_id = s.id
       JOIN semesters sem ON r.semester_id = sem.id
       WHERE r.student_id = ?`,
      [studentId]
    );

    // 3. Fetch attendance
    const attendance = await db.query(
      `SELECT att.total_classes, att.attended_classes, att.percentage, s.name as subject_name, s.code as subject_code
       FROM attendance att
       JOIN subjects s ON att.subject_id = s.id
       WHERE att.student_id = ?`,
      [studentId]
    );

    // 4. Fetch class averages for comparison (Compare student marks vs class average)
    let classAverages = [];
    if (classId) {
      classAverages = await db.query(
        `SELECT r.subject_id, s.name as subject_name, AVG(r.total_marks) as class_average
         FROM results r
         JOIN student_profiles sp ON r.student_id = sp.id
         JOIN subjects s ON r.subject_id = s.id
         WHERE sp.class_id = ?
         GROUP BY r.subject_id`,
        [classId]
      );
    }

    // 5. Fetch AI Predictions & Suggestions
    const predictions = await db.query(
      'SELECT predicted_gpa, risk_level, weak_subjects, career_recommendations, study_plan FROM student_predictions WHERE student_id = ?',
      [studentId]
    );

    // 6. Fetch recent notifications
    const notifications = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
      [req.user.id]
    );

    // 7. Calculate overall stats
    let cgpa = 0.00;
    let totalCredits = 0;
    let totalPoints = 0;
    let passCount = 0;
    let failCount = 0;

    results.forEach(r => {
      totalCredits += r.credits;
      totalPoints += r.gpa * r.credits;
      if (r.status === 'pass') passCount++;
      else failCount++;
    });

    if (totalCredits > 0) {
      cgpa = (totalPoints / totalCredits).toFixed(2);
    }

    res.json({
      success: true,
      data: {
        profile: {
          id: student.id,
          name: student.name,
          email: student.email,
          rollNumber: student.roll_number,
          department: student.department_name,
          class: student.class_name,
          semester: student.semester_name,
          phone: student.phone,
          dob: student.dob
        },
        stats: {
          cgpa,
          totalCredits,
          passCount,
          failCount,
          overallAttendance: attendance.length > 0 
            ? (attendance.reduce((acc, curr) => acc + parseFloat(curr.percentage), 0) / attendance.length).toFixed(1)
            : '0.0'
        },
        results,
        attendance,
        classAverages,
        aiInsights: predictions[0] || {
          predicted_gpa: 0,
          risk_level: 'low',
          weak_subjects: '[]',
          career_recommendations: '[]',
          study_plan: 'Insufficient data for analysis.'
        },
        notifications
      }
    });
  } catch (error) {
    next(error);
  }
};
