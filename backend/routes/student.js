import express from 'express';
import { getStudentDashboard } from '../controllers/studentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('student'));

router.get('/dashboard', getStudentDashboard);

export default router;
