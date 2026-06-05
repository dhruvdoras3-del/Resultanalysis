import axios from 'axios';

// Configure default base parameters
const api = axios.create({
  baseURL: '', // Proxied via Vite config to localhost:5000 in development
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject JWT authorization token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper to handle standard API responses/errors
const handleResponse = async (promise) => {
  try {
    const response = await promise;
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'API request failed';
    throw new Error(message);
  }
};

// Authentication Services
export const authService = {
  login: (username, password) => handleResponse(api.post('/api/auth/login', { username, password })),
  getProfile: () => handleResponse(api.get('/api/auth/profile')),
  updateProfile: (data) => handleResponse(api.put('/api/auth/profile', data)),
  forgotPassword: (email) => handleResponse(api.post('/api/auth/forgot-password', { email })),
  resetPassword: (password, token) => handleResponse(api.post('/api/auth/reset-password', { password, token }))
};

// Admin Module Services
export const adminService = {
  getStats: () => handleResponse(api.get('/api/admin/stats')),
  
  // Students
  getStudents: (params) => handleResponse(api.get('/api/admin/students', { params })),
  addStudent: (data) => handleResponse(api.post('/api/admin/students', data)),
  updateStudent: (id, data) => handleResponse(api.put(`/api/admin/students/${id}`, data)),
  deleteStudent: (id) => handleResponse(api.delete(`/api/admin/students/${id}`)),
  
  // Faculty
  getFaculty: (params) => handleResponse(api.get('/api/admin/faculty', { params })),
  addFaculty: (data) => handleResponse(api.post('/api/admin/faculty', data)),
  updateFaculty: (id, data) => handleResponse(api.put(`/api/admin/faculty/${id}`, data)),
  deleteFaculty: (id) => handleResponse(api.delete(`/api/admin/faculty/${id}`)),
  
  // Academics
  getAcademics: () => handleResponse(api.get('/api/admin/academics')),
  addDepartment: (data) => handleResponse(api.post('/api/admin/departments', data)),
  addClass: (data) => handleResponse(api.post('/api/admin/classes', data)),
  addSubject: (data) => handleResponse(api.post('/api/admin/subjects', data)),
  addSemester: (data) => handleResponse(api.post('/api/admin/semesters', data)),
  
  // Assignments
  getAssignments: () => handleResponse(api.get('/api/admin/assignments')),
  assignSubjectFaculty: (data) => handleResponse(api.post('/api/admin/assignments', data)),
  deleteAssignment: (id) => handleResponse(api.delete(`/api/admin/assignments/${id}`)),
  
  // Bulk Ingestion
  importStudents: (formData) => handleResponse(api.post('/api/admin/import-students', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })),
  
  // Audit
  getAuditLogs: () => handleResponse(api.get('/api/admin/audit-logs'))
};

// Faculty Module Services
export const facultyService = {
  getDashboard: () => handleResponse(api.get('/api/faculty/dashboard')),
  getStudentsForMarks: (classId, subjectId) => handleResponse(api.get('/api/faculty/students', { params: { classId, subjectId } })),
  saveMarks: (classId, subjectId, marksData) => handleResponse(api.post('/api/faculty/marks', { classId, subjectId, marksData })),
  saveAttendance: (classId, subjectId, attendanceData) => handleResponse(api.post('/api/faculty/attendance', { classId, subjectId, attendanceData })),
  uploadMarksExcel: (classId, subjectId, file) => {
    const formData = new FormData();
    formData.append('classId', classId);
    formData.append('subjectId', subjectId);
    formData.append('file', file);
    return handleResponse(api.post('/api/faculty/upload-marks', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }));
  },
  getCourseAnalytics: (classId, subjectId) => handleResponse(api.get('/api/faculty/course-analytics', { params: { classId, subjectId } }))
};

// Student Module Services
export const studentService = {
  getDashboard: () => handleResponse(api.get('/api/student/dashboard'))
};

// AI Engine Services
export const aiService = {
  sendMessage: (message) => handleResponse(api.post('/api/ai/chat', { message }))
};

export default api;
