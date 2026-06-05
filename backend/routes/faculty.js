import express from 'express';
import multer from 'multer';
import { 
  getFacultyDashboard, 
  getStudentsForMarks, 
  saveMarks, 
  saveAttendance, 
  uploadMarksExcel, 
  getCourseAnalytics 
} from '../controllers/facultyController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

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

router.use(protect);
router.use(authorize('faculty'));

router.get('/dashboard', getFacultyDashboard);
router.get('/students', getStudentsForMarks);
router.post('/marks', saveMarks);
router.post('/attendance', saveAttendance);
router.post('/upload-marks', upload.single('file'), uploadMarksExcel);
router.get('/course-analytics', getCourseAnalytics);

export default router;
