-- Result Analysis System Database Schema (MySQL)

-- Disable foreign key checks during initialization
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Departments Table
DROP TABLE IF EXISTS departments;
CREATE TABLE departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  role ENUM('admin', 'faculty', 'student') NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Faculty Profiles Table
DROP TABLE IF EXISTS faculty_profiles;
CREATE TABLE faculty_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  department_id INT,
  designation VARCHAR(50) DEFAULT 'Assistant Professor',
  phone VARCHAR(15),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- 4. Semesters Table
DROP TABLE IF EXISTS semesters;
CREATE TABLE semesters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(20) NOT NULL,
  academic_year VARCHAR(10) NOT NULL,
  status VARCHAR(15) DEFAULT 'active'
);

-- 5. Classes Table
DROP TABLE IF EXISTS classes;
CREATE TABLE classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  department_id INT NOT NULL,
  semester_id INT NOT NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE
);

-- 6. Subjects Table
DROP TABLE IF EXISTS subjects;
CREATE TABLE subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  department_id INT NOT NULL,
  credits INT DEFAULT 3,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- 7. Student Profiles Table
DROP TABLE IF EXISTS student_profiles;
CREATE TABLE student_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  roll_number VARCHAR(30) UNIQUE NOT NULL,
  department_id INT NOT NULL,
  class_id INT,
  semester_id INT,
  phone VARCHAR(15),
  dob DATE,
  enrollment_date DATE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
  FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE SET NULL
);

-- 8. Subject-Faculty Assignment Table
DROP TABLE IF EXISTS subject_faculty;
CREATE TABLE subject_faculty (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id INT NOT NULL,
  faculty_id INT NOT NULL,
  class_id INT NOT NULL,
  UNIQUE KEY unique_sub_fac_class (subject_id, faculty_id, class_id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (faculty_id) REFERENCES faculty_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- 9. Results Table
DROP TABLE IF EXISTS results;
CREATE TABLE results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  semester_id INT NOT NULL,
  internal_marks DECIMAL(5,2) DEFAULT 0.00,
  external_marks DECIMAL(5,2) DEFAULT 0.00,
  total_marks DECIMAL(5,2) DEFAULT 0.00,
  grade VARCHAR(2) DEFAULT 'F',
  gpa DECIMAL(3,2) DEFAULT 0.00,
  status VARCHAR(10) DEFAULT 'fail',
  exam_date DATE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_student_subject_sem (student_id, subject_id, semester_id),
  FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES faculty_profiles(id) ON DELETE SET NULL
);

-- 10. Attendance Table
DROP TABLE IF EXISTS attendance;
CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  semester_id INT NOT NULL,
  total_classes INT DEFAULT 0,
  attended_classes INT DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0.00,
  UNIQUE KEY unique_student_subject_attendance (student_id, subject_id, semester_id),
  FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE
);

-- 11. Notifications Table
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 12. Student Predictions (AI Insights)
DROP TABLE IF EXISTS student_predictions;
CREATE TABLE student_predictions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNIQUE NOT NULL,
  predicted_gpa DECIMAL(3,2) DEFAULT 0.00,
  risk_level VARCHAR(20) DEFAULT 'low',
  weak_subjects TEXT,
  career_recommendations TEXT,
  study_plan TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
);

-- 13. Audit Logs Table
DROP TABLE IF EXISTS audit_logs;
CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
