import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import db, { dbType } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDb() {
  console.log(`\n=== Database Initializer starting (DB Type: ${dbType}) ===`);
  
  try {
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');

    if (dbType === 'sqlite') {
      console.log('Transforming MySQL schema to SQLite format...');
      
      // Replace foreign key disable/enable
      schemaSql = schemaSql
        .replace(/SET FOREIGN_KEY_CHECKS = 0;/g, 'PRAGMA foreign_keys = OFF;')
        .replace(/SET FOREIGN_KEY_CHECKS = 1;/g, 'PRAGMA foreign_keys = ON;');
      
      // Replace Auto-Increment
      schemaSql = schemaSql.replace(/INT AUTO_INCREMENT PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT');
      schemaSql = schemaSql.replace(/INTEGER AUTO_INCREMENT PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT');
      
      // Replace MySQL data types
      schemaSql = schemaSql.replace(/ENUM\([^)]+\)/g, 'TEXT');
      schemaSql = schemaSql.replace(/DECIMAL\([^)]+\)/g, 'REAL');
      schemaSql = schemaSql.replace(/TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP/g, 'DATETIME DEFAULT CURRENT_TIMESTAMP');
      schemaSql = schemaSql.replace(/TIMESTAMP DEFAULT CURRENT_TIMESTAMP/g, 'DATETIME DEFAULT CURRENT_TIMESTAMP');
      
      // Replace Indexes and Unique Keys
      schemaSql = schemaSql.replace(/UNIQUE KEY (\w+) \(([^)]+)\)/g, 'UNIQUE ($2)');
      schemaSql = schemaSql.replace(/KEY \w+ \([^)]+\),?/g, '');
      
      // Remove table options
      schemaSql = schemaSql.replace(/ENGINE=InnoDB[^;]*/g, '');
    }

    // Split schema into separate statements and execute them
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Executing ${statements.length} schema statements...`);
    
    // SQLite can struggle with multiple CREATE/DROP queries, run them sequentially
    if (dbType === 'sqlite') {
      await db.query('PRAGMA foreign_keys = OFF;');
    }
    
    for (const stmt of statements) {
      try {
        await db.query(stmt);
      } catch (stmtErr) {
        // Ignore errors about tables that do not exist yet when dropping
        if (!stmt.toLowerCase().startsWith('drop table') && !stmt.toLowerCase().includes('if exists')) {
          console.warn(`Statement Warning:`, stmtErr.message);
          console.warn(`Failed Statement:`, stmt);
        }
      }
    }
    
    if (dbType === 'sqlite') {
      await db.query('PRAGMA foreign_keys = ON;');
    }
    
    console.log('Database schema created successfully.');

    // Seed Data Check
    const usersExist = await db.query('SELECT COUNT(*) as count FROM users');
    const count = usersExist[0]?.count || usersExist[0]?.['COUNT(*)'] || 0;
    
    if (count > 0) {
      console.log('Database already has data. Skipping seeder.');
      return;
    }

    console.log('Seeding database with sample data...');

    // 1. Insert Departments
    const deptCSE = await db.query("INSERT INTO departments (name, code) VALUES ('Computer Science & Engineering', 'CSE')");
    const deptECE = await db.query("INSERT INTO departments (name, code) VALUES ('Electronics & Communication', 'ECE')");
    const deptME = await db.query("INSERT INTO departments (name, code) VALUES ('Mechanical Engineering', 'ME')");
    
    const cseId = deptCSE.insertId || 1;
    const eceId = deptECE.insertId || 2;
    const meId = deptME.insertId || 3;

    // 2. Insert Semesters
    const sem1 = await db.query("INSERT INTO semesters (name, academic_year, status) VALUES ('Semester 1', '2025-2026', 'inactive')");
    const sem2 = await db.query("INSERT INTO semesters (name, academic_year, status) VALUES ('Semester 2', '2025-2026', 'active')");
    
    const sem1Id = sem1.insertId || 1;
    const sem2Id = sem2.insertId || 2;

    // 3. Insert Classes
    const classCSEA = await db.query(`INSERT INTO classes (name, department_id, semester_id) VALUES ('CSE-A', ${cseId}, ${sem2Id})`);
    const classCSEB = await db.query(`INSERT INTO classes (name, department_id, semester_id) VALUES ('CSE-B', ${cseId}, ${sem2Id})`);
    const classECEA = await db.query(`INSERT INTO classes (name, department_id, semester_id) VALUES ('ECE-A', ${eceId}, ${sem2Id})`);
    
    const cseClassA = classCSEA.insertId || 1;
    const cseClassB = classCSEB.insertId || 2;
    const eceClassA = classECEA.insertId || 3;

    // 4. Insert Subjects
    // CSE Subjects
    const subMath = await db.query(`INSERT INTO subjects (name, code, department_id, credits) VALUES ('Engineering Mathematics', 'MTH101', ${cseId}, 4)`);
    const subDSA = await db.query(`INSERT INTO subjects (name, code, department_id, credits) VALUES ('Data Structures & Algorithms', 'CSE201', ${cseId}, 4)`);
    const subDBMS = await db.query(`INSERT INTO subjects (name, code, department_id, credits) VALUES ('Database Management Systems', 'CSE202', ${cseId}, 3)`);
    const subWeb = await db.query(`INSERT INTO subjects (name, code, department_id, credits) VALUES ('Full-Stack Web Development', 'CSE203', ${cseId}, 4)`);
    // ECE Subjects
    const subDE = await db.query(`INSERT INTO subjects (name, code, department_id, credits) VALUES ('Digital Electronics', 'ECE201', ${eceId}, 3)`);
    const subSignals = await db.query(`INSERT INTO subjects (name, code, department_id, credits) VALUES ('Signals and Systems', 'ECE202', ${eceId}, 4)`);

    const mthId = subMath.insertId || 1;
    const dsaId = subDSA.insertId || 2;
    const dbmsId = subDBMS.insertId || 3;
    const webId = subWeb.insertId || 4;
    const deId = subDE.insertId || 5;
    const sigId = subSignals.insertId || 6;

    // 5. Create Users & Profiles
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const facultyPassword = await bcrypt.hash('faculty123', salt);
    const studentPassword = await bcrypt.hash('student123', salt);

    // Admin
    await db.query("INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)", 
      ['admin', adminPassword, 'admin@university.edu', 'admin']
    );

    // Faculty Users
    const f1User = await db.query("INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)", 
      ['faculty1', facultyPassword, 'alice.j@university.edu', 'faculty']
    );
    const f2User = await db.query("INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)", 
      ['faculty2', facultyPassword, 'bob.s@university.edu', 'faculty']
    );
    const f3User = await db.query("INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)", 
      ['faculty3', facultyPassword, 'charlie.b@university.edu', 'faculty']
    );

    const f1UserId = f1User.insertId || 2;
    const f2UserId = f2User.insertId || 3;
    const f3UserId = f3User.insertId || 4;

    // Faculty Profiles
    const fac1 = await db.query("INSERT INTO faculty_profiles (user_id, department_id, designation, phone) VALUES (?, ?, ?, ?)",
      [f1UserId, cseId, 'Professor & Head', '9876543210']
    );
    const fac2 = await db.query("INSERT INTO faculty_profiles (user_id, department_id, designation, phone) VALUES (?, ?, ?, ?)",
      [f2UserId, cseId, 'Assistant Professor', '9876543211']
    );
    const fac3 = await db.query("INSERT INTO faculty_profiles (user_id, department_id, designation, phone) VALUES (?, ?, ?, ?)",
      [f3UserId, eceId, 'Associate Professor', '9876543212']
    );

    const fProfile1Id = fac1.insertId || 1;
    const fProfile2Id = fac2.insertId || 2;
    const fProfile3Id = fac3.insertId || 3;

    // Map Faculty to Subjects
    // Prof Alice CSE-A: DSA & Web
    await db.query("INSERT INTO subject_faculty (subject_id, faculty_id, class_id) VALUES (?, ?, ?)", [dsaId, fProfile1Id, cseClassA]);
    await db.query("INSERT INTO subject_faculty (subject_id, faculty_id, class_id) VALUES (?, ?, ?)", [webId, fProfile1Id, cseClassA]);
    // Prof Bob CSE-A: Math & DBMS
    await db.query("INSERT INTO subject_faculty (subject_id, faculty_id, class_id) VALUES (?, ?, ?)", [mthId, fProfile2Id, cseClassA]);
    await db.query("INSERT INTO subject_faculty (subject_id, faculty_id, class_id) VALUES (?, ?, ?)", [dbmsId, fProfile2Id, cseClassA]);
    // Prof Charlie ECE-A: DE & Signals
    await db.query("INSERT INTO subject_faculty (subject_id, faculty_id, class_id) VALUES (?, ?, ?)", [deId, fProfile3Id, eceClassA]);
    await db.query("INSERT INTO subject_faculty (subject_id, faculty_id, class_id) VALUES (?, ?, ?)", [sigId, fProfile3Id, eceClassA]);

    // CSE-B Subjects assignments
    await db.query("INSERT INTO subject_faculty (subject_id, faculty_id, class_id) VALUES (?, ?, ?)", [dsaId, fProfile2Id, cseClassB]);
    await db.query("INSERT INTO subject_faculty (subject_id, faculty_id, class_id) VALUES (?, ?, ?)", [webId, fProfile1Id, cseClassB]);
    await db.query("INSERT INTO subject_faculty (subject_id, faculty_id, class_id) VALUES (?, ?, ?)", [mthId, fProfile2Id, cseClassB]);
    await db.query("INSERT INTO subject_faculty (subject_id, faculty_id, class_id) VALUES (?, ?, ?)", [dbmsId, fProfile1Id, cseClassB]);

    // 6. Insert Students (15 students)
    const studentsData = [
      // CSE Class A (High performers, average, low performers)
      { username: 'student1', email: 'stu1@university.edu', name: 'John Doe', roll: 'CS202501', dept: cseId, cls: cseClassA, perf: 'high' },
      { username: 'student2', email: 'stu2@university.edu', name: 'Jane Smith', roll: 'CS202502', dept: cseId, cls: cseClassA, perf: 'high' },
      { username: 'student3', email: 'stu3@university.edu', name: 'David Lee', roll: 'CS202503', dept: cseId, cls: cseClassA, perf: 'average' },
      { username: 'student4', email: 'stu4@university.edu', name: 'Emma Watson', roll: 'CS202504', dept: cseId, cls: cseClassA, perf: 'average' },
      { username: 'student5', email: 'stu5@university.edu', name: 'Ryan Reynolds', roll: 'CS202505', dept: cseId, cls: cseClassA, perf: 'low' },
      // CSE Class B
      { username: 'student6', email: 'stu6@university.edu', name: 'Sophia Turner', roll: 'CS202506', dept: cseId, cls: cseClassB, perf: 'high' },
      { username: 'student7', email: 'stu7@university.edu', name: 'Michael Jordan', roll: 'CS202507', dept: cseId, cls: cseClassB, perf: 'average' },
      { username: 'student8', email: 'stu8@university.edu', name: 'Chris Evans', roll: 'CS202508', dept: cseId, cls: cseClassB, perf: 'average' },
      { username: 'student9', email: 'stu9@university.edu', name: 'Robert Downey', roll: 'CS202509', dept: cseId, cls: cseClassB, perf: 'average' },
      { username: 'student10', email: 'stu10@university.edu', name: 'Scarlett Joh', roll: 'CS202510', dept: cseId, cls: cseClassB, perf: 'low' },
      // ECE Class A
      { username: 'student11', email: 'stu11@university.edu', name: 'Tom Holland', roll: 'EC202501', dept: eceId, cls: eceClassA, perf: 'high' },
      { username: 'student12', email: 'stu12@university.edu', name: 'Zendaya Coleman', roll: 'EC202502', dept: eceId, cls: eceClassA, perf: 'high' },
      { username: 'student13', email: 'stu13@university.edu', name: 'Benedict C', roll: 'EC202503', dept: eceId, cls: eceClassA, perf: 'average' },
      { username: 'student14', email: 'stu14@university.edu', name: 'Elizabeth Olsen', roll: 'EC202504', dept: eceId, cls: eceClassA, perf: 'low' },
      { username: 'student15', email: 'stu15@university.edu', name: 'Mark Ruffalo', roll: 'EC202505', dept: eceId, cls: eceClassA, perf: 'low' }
    ];

    const studentProfileIds = [];

    for (const stu of studentsData) {
      // Create user
      const userRes = await db.query(
        "INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)",
        [stu.username, studentPassword, stu.email, 'student']
      );
      const uId = userRes.insertId;
      
      // Create student profile
      const profRes = await db.query(
        "INSERT INTO student_profiles (user_id, roll_number, department_id, class_id, semester_id, phone, dob, enrollment_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          uId, 
          stu.roll, 
          stu.dept, 
          stu.cls, 
          sem2Id, 
          '9988776655', 
          '2005-08-15', 
          '2024-07-01'
        ]
      );
      
      const studentProfileId = profRes.insertId;
      studentProfileIds.push({
        id: studentProfileId,
        perf: stu.perf,
        dept: stu.dept,
        cls: stu.cls,
        name: stu.name
      });
    }

    console.log(`Created ${studentProfileIds.length} student profiles.`);

    // 7. Results and Attendance Generation Helper
    const grades = [
      { min: 90, grade: 'S', gpa: 10 },
      { min: 80, grade: 'A', gpa: 9 },
      { min: 70, grade: 'B', gpa: 8 },
      { min: 60, grade: 'C', gpa: 7 },
      { min: 50, grade: 'D', gpa: 6 },
      { min: 40, grade: 'E', gpa: 5 },
      { min: 0, grade: 'F', gpa: 0 }
    ];

    const calculateGrade = (total) => {
      for (const g of grades) {
        if (total >= g.min) return { grade: g.grade, gpa: g.gpa };
      }
      return { grade: 'F', gpa: 0 };
    };

    console.log('Generating results and attendance data...');
    
    for (const student of studentProfileIds) {
      // Get subjects for student's department
      const subList = await db.query("SELECT * FROM subjects WHERE department_id = ?", [student.dept]);
      
      let totalGpa = 0;
      let totalCredits = 0;
      const weakSubjects = [];
      const marksRecords = [];

      for (const subject of subList) {
        let internal = 0;
        let external = 0;
        let total = 0;
        let totalClasses = 60;
        let attendedClasses = 0;

        if (student.perf === 'high') {
          internal = Math.floor(Math.random() * 10) + 30; // 30-40 (out of 40)
          external = Math.floor(Math.random() * 15) + 45; // 45-60 (out of 60)
          attendedClasses = Math.floor(Math.random() * 10) + 50; // 50-60 classes
        } else if (student.perf === 'average') {
          internal = Math.floor(Math.random() * 15) + 20; // 20-35
          external = Math.floor(Math.random() * 20) + 30; // 30-50
          attendedClasses = Math.floor(Math.random() * 15) + 42; // 42-57 classes (70% - 95%)
        } else {
          // low performance / at risk
          internal = Math.floor(Math.random() * 15) + 10; // 10-25
          external = Math.floor(Math.random() * 20) + 15; // 15-35
          attendedClasses = Math.floor(Math.random() * 20) + 30; // 30-50 classes (50% - 83%)
        }

        total = internal + external;
        const { grade, gpa } = calculateGrade(total);
        const status = total >= 40 ? 'pass' : 'fail';
        
        if (status === 'fail' || total < 55) {
          weakSubjects.push(subject.name);
        }

        totalGpa += gpa * subject.credits;
        totalCredits += subject.credits;

        const facultyAssigned = await db.query(
          "SELECT faculty_id FROM subject_faculty WHERE subject_id = ? AND class_id = ?",
          [subject.id, student.cls]
        );
        const createdBy = facultyAssigned[0]?.faculty_id || 1;

        // Insert Result
        await db.query(
          "INSERT INTO results (student_id, subject_id, semester_id, internal_marks, external_marks, total_marks, grade, gpa, status, exam_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            student.id, 
            subject.id, 
            sem2Id, 
            internal, 
            external, 
            total, 
            grade, 
            gpa, 
            status, 
            '2026-05-15', 
            createdBy
          ]
        );

        // Insert Attendance
        const attendancePercentage = ((attendedClasses / totalClasses) * 100).toFixed(2);
        await db.query(
          "INSERT INTO attendance (student_id, subject_id, semester_id, total_classes, attended_classes, percentage) VALUES (?, ?, ?, ?, ?, ?)",
          [
            student.id,
            subject.id,
            sem2Id,
            totalClasses,
            attendedClasses,
            attendancePercentage
          ]
        );

        marksRecords.push({ subject: subject.name, total, attendancePercentage });
      }

      // Calculate semester final GPA
      const finalGpa = (totalGpa / totalCredits).toFixed(2);
      const overallAttendance = (
        marksRecords.reduce((acc, curr) => acc + parseFloat(curr.attendancePercentage), 0) / marksRecords.length
      ).toFixed(2);

      // AI Predictions Generation
      let riskLevel = 'low';
      if (finalGpa < 5.5 || overallAttendance < 75) {
        riskLevel = 'high';
      } else if (finalGpa < 7.0 || overallAttendance < 82) {
        riskLevel = 'medium';
      }

      const predictedGpa = (parseFloat(finalGpa) + (overallAttendance > 85 ? 0.3 : -0.2)).toFixed(2);

      // Career recommendations based on performance
      let careers = ['Software Engineer', 'Systems Analyst'];
      if (student.dept === eceId) {
        careers = ['Embedded Engineer', 'VLSI Design Engineer', 'IoT Specialist'];
      } else if (student.dept === cseId) {
        // Find if web was top score
        careers = ['Full-Stack Developer', 'DevOps Architect', 'Data Scientist'];
      }

      let studyPlan = `### AI Recommended Study Plan for ${student.name}
1. **Focus Area**: Devote 3 hours/week to ${weakSubjects.length > 0 ? weakSubjects.join(', ') : 'Advanced Algorithms'}.
2. **Attendance Improvement**: Current attendance is ${overallAttendance}%. Attend supplementary sessions to cross 85%.
3. **Practice**: Complete 2 coding/practical mock tests weekly.
4. **Peer Group**: Join study sessions with top performers in class.`;

      await db.query(
        "INSERT INTO student_predictions (student_id, predicted_gpa, risk_level, weak_subjects, career_recommendations, study_plan) VALUES (?, ?, ?, ?, ?, ?)",
        [
          student.id,
          predictedGpa,
          riskLevel,
          JSON.stringify(weakSubjects),
          JSON.stringify(careers),
          studyPlan
        ]
      );
    }

    // 8. System Notifications
    await db.query("INSERT INTO notifications (user_id, title, message, type) VALUES (1, 'System Initialized', 'Database was configured with CSE & ECE courses successfully.', 'info')");
    await db.query("INSERT INTO notifications (user_id, title, message, type) VALUES (2, 'Course Assigned', 'You have been assigned Full-Stack Web Development for CSE-A.', 'info')");
    await db.query("INSERT INTO notifications (user_id, title, message, type) VALUES (5, 'Result Declared', 'Semester 2 examination results are now live.', 'result')");
    await db.query("INSERT INTO notifications (user_id, title, message, type) VALUES (9, 'Low Attendance Alert', 'Your overall attendance is below 75%. Please contact your faculty advisor.', 'alert')");

    // 9. Audit Logs
    await db.query("INSERT INTO audit_logs (user_id, action, details) VALUES (1, 'DB_INIT', 'Database seeded with departments, semesters, subjects, and users.')");

    console.log('Database seeded successfully!');
    console.log('=== Database Seeding Completed ===\n');

  } catch (err) {
    console.error('Error during database initialization:', err);
  }
}

// Check if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initDb().then(() => process.exit(0)).catch(() => process.exit(1));
}

export { initDb };
export default initDb;
