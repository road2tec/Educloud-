import axios from 'axios';

const API_BASE_URL = import.meta.env.MODE === 'production' 
  ? 'https://p-educlud.onrender.com/api' 
  : 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Removed window.location.href = '/login' to prevent auto-redirecting guest users from the homepage
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
};

// Teacher API
export const teacherAPI = {
  // Dashboard
  getAssignedClasses: () => api.get('/teachers/dashboard/classes'),
  getClassStudents: (classId) => api.get(`/teachers/dashboard/classes/${classId}/students`),
  getStudentDetails: (studentId) => api.get(`/teachers/dashboard/students/${studentId}`),
  getTeacherExams: () => api.get('/teachers/dashboard/exams'),
  getClassPerformance: (classId) => api.get(`/teachers/dashboard/classes/${classId}/performance`),
  getTeacherSchedule: () => api.get('/teachers/dashboard/schedule'),
  getTeacherNotifications: () => api.get('/teachers/dashboard/notifications'),
  updateTeacherMetrics: () => api.post('/teachers/dashboard/update-metrics'),

  // Auth
  teacherLogin: (credentials) => api.post('/auth/login', credentials),
  teacherRegister: (teacherData) => api.post('/auth/register', teacherData),
};

// Parent API
export const parentAPI = {
  // Dashboard
  getChildrenOverview: () => api.get('/parents/dashboard/children'),
  getChildPerformance: (studentId) => api.get(`/parents/dashboard/children/${studentId}/performance`),
  getChildAttendance: (studentId, params) => api.get(`/parents/dashboard/children/${studentId}/attendance`, { params }),
  contactTeacher: (data) => api.post('/parents/dashboard/contact-teacher', data),
  getParentNotifications: () => api.get('/parents/dashboard/notifications'),
  markNotificationRead: (notificationId) => api.put(`/parents/dashboard/notifications/${notificationId}/read`),
  updateCommunicationPreferences: (preferences) => api.put('/parents/dashboard/preferences', preferences),

  // Auth
  parentLogin: (credentials) => api.post('/auth/login', credentials),
  parentRegister: (parentData) => api.post('/auth/register', parentData),
};

// Attendance API
export const attendanceAPI = {
  markAttendance: (attendanceData) => api.post('/attendance/mark', attendanceData),
  markBulkAttendance: (bulkData) => api.post('/attendance/bulk-mark', bulkData),
  getStudentAttendance: (studentId) => api.get(`/attendance/student/${studentId}`),
  getClassAttendance: (classId) => api.get(`/attendance/class/${classId}`),
  updateAttendance: (id, updateData) => api.put(`/attendance/${id}`, updateData),
  deleteAttendance: (id) => api.delete(`/attendance/${id}`),
  getAttendanceReport: (params) => api.get('/attendance/report', { params }),
};

// Student API (existing)
export const studentAPI = {
  getDashboard: () => api.get('/exams'),
  getExams: () => api.get('/exams'),
  takeExam: (examId, answers) => api.post(`/exams/${examId}/submit`, { answers }),
  getExamResults: (examId) => api.get(`/exams/${examId}/results`),
  getTimetable: () => api.get('/timetables'),
  getReports: () => api.get('/reports/user'),
  getNotifications: () => api.get('/notifications'),
};

// Admin API (existing)
export const adminAPI = {
  getDashboard: () => api.get('/users'),
  getUsers: () => api.get('/users'),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getExams: () => api.get('/exams'),
  createExam: (examData) => api.post('/exams', examData),
  updateExam: (id, examData) => api.put(`/exams/${id}`, examData),
  deleteExam: (id) => api.delete(`/exams/${id}`),
  getTimetables: () => api.get('/timetables'),
  createTimetable: (timetableData) => api.post('/timetables', timetableData),
  updateTimetable: (id, timetableData) => api.put(`/timetables/${id}`, timetableData),
  deleteTimetable: (id) => api.delete(`/timetables/${id}`),
  getReports: () => api.get('/reports'),
  getNotifications: () => api.get('/notifications'),
  createNotification: (notificationData) => api.post('/notifications', notificationData),
  updateNotification: (id, notificationData) => api.put(`/notifications/${id}`, notificationData),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

// Contact API
export const contactAPI = {
  submitContactForm: (contactData) => api.post('/contact', contactData),
  getContactMessages: (params) => api.get('/contact', { params }),
  getUserContactMessages: () => api.get('/contact/user'),
  getContactStats: () => api.get('/contact/stats'),
  getContactMessage: (id) => api.get(`/contact/${id}`),
  updateContactMessage: (id, updateData) => api.put(`/contact/${id}`, updateData),
  deleteContactMessage: (id) => api.delete(`/contact/${id}`),
};
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

export default api;
