import express from 'express';
import multer from 'multer';
import { 
  getStats, 
  getStudents, addStudent, updateStudent, deleteStudent,
  getFaculty, addFaculty, updateFaculty, deleteFaculty,
  getAcademics, addDepartment, addClass, addSubject, addSemester,
  getAssignments, assignSubjectFaculty, deleteAssignment,
  importStudents, getAuditLogs
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure multer for memory storage uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel' || 
        file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) or CSV files are supported!'), false);
    }
  }
});

// Protect all routes under /api/admin to require admin privileges
router.use(protect);
router.use(authorize('admin'));

// Stats
router.get('/stats', getStats);

// Student Management
router.get('/students', getStudents);
router.post('/students', addStudent);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

// Faculty Management
router.get('/faculty', getFaculty);
router.post('/faculty', addFaculty);
router.put('/faculty/:id', updateFaculty);
router.delete('/faculty/:id', deleteFaculty);

// Academics Configurations
router.get('/academics', getAcademics);
router.post('/departments', addDepartment);
router.post('/classes', addClass);
router.post('/subjects', addSubject);
router.post('/semesters', addSemester);

// Faculty Assignments
router.get('/assignments', getAssignments);
router.post('/assignments', assignSubjectFaculty);
router.delete('/assignments/:id', deleteAssignment);

// Excel/CSV Bulk Data Ingestions
router.post('/import-students', upload.single('file'), importStudents);

// Audit logs
router.get('/audit-logs', getAuditLogs);

export default router;
