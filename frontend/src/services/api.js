import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Token is added from auth store
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const { useAuthStore } = await import('../stores/authStore');
        const refreshed = await useAuthStore.getState().refreshTokens();
        
        if (refreshed) {
          const { accessToken } = useAuthStore.getState();
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Logout if refresh fails
        const { useAuthStore } = await import('../stores/authStore');
        useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// API helper functions
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  updatePreferences: (data) => api.put('/auth/me/preferences', data),
};

export const lessonsAPI = {
  getCourses: () => api.get('/lessons/courses'),
  getModules: (courseId) => api.get(`/lessons/courses/${courseId}/modules`),
  getLessons: (params) => api.get('/lessons', { params }),
  getLesson: (slug) => api.get(`/lessons/${slug}`),
  startLesson: (slug) => api.post(`/lessons/${slug}/start`),
  updateProgress: (slug, data) => api.put(`/lessons/${slug}/progress`, data),
  completeLesson: (slug) => api.post(`/lessons/${slug}/complete`),
  getUserProgress: () => api.get('/lessons/user/progress'),
};

export const codeAPI = {
  runCode: (data) => api.post('/code/run', data),
  submitChallenge: (slug, data) => api.post(`/code/challenges/${slug}/submit`, data),
  getChallenge: (slug) => api.get(`/code/challenges/${slug}`),
  getSubmission: (id) => api.get(`/code/submissions/${id}`),
};

export const aiAPI = {
  chat: (data) => api.post('/ai/chat', data),
  chatWithVoice: (data) => api.post('/ai/chat/voice', data),
  getCodeHelp: (data) => api.post('/ai/help/code', data),
  explainConcept: (data) => api.post('/ai/explain', data),
  transcribe: (formData) => api.post('/ai/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  speechToText: (formData) => api.post('/ai/stt', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  textToSpeech: (data) => api.post('/ai/tts', data),
};

export const mcqAPI = {
  startQuiz: (data) => api.post('/mcq/quiz/start', data),
  submitQuiz: (data) => api.post('/mcq/quiz/submit', data),
  getQuizResult: (attemptId) => api.get(`/mcq/quiz/${attemptId}`),
  getTopics: () => api.get('/mcq/topics'),
};

export const competeAPI = {
  getContests: (status) => api.get('/compete/contests', { params: { status } }),
  getContest: (id) => api.get(`/compete/contests/${id}`),
  registerContest: (contestId) => api.post(`/compete/contests/${contestId}/register`),
  submitSolution: (contestId, data) => api.post(`/compete/contests/${contestId}/submit`, data),
  getContestLeaderboard: (id, params) => api.get(`/compete/contests/${id}/leaderboard`, { params }),
  getLeaderboard: (params) => api.get('/compete/leaderboard', { params }),
  getUserContestHistory: (userId) => api.get(`/compete/user/${userId}/contests`),
};

export const gamifyAPI = {
  getProfile: () => api.get('/gamify/profile'),
  getBadges: () => api.get('/gamify/badges'),
  getUserBadges: () => api.get('/gamify/badges/user'),
  getAchievements: () => api.get('/gamify/achievements'),
  getThemes: () => api.get('/gamify/themes'),
  purchaseTheme: (data) => api.post('/gamify/themes/purchase', data),
  claimDailyReward: () => api.post('/gamify/daily-reward'),
  getTransactions: (limit) => api.get('/gamify/transactions', { params: { limit } }),
  checkBadges: () => api.post('/gamify/check-badges'),
};

export const proctorAPI = {
  startSession: (data) => api.post('/proctor/sessions/start', data),
  activateSession: (sessionId) => api.post(`/proctor/sessions/${sessionId}/activate`),
  reportViolation: (sessionId, data) => api.post(`/proctor/sessions/${sessionId}/violations`, data),
  reportEvent: (sessionId, data) => api.post(`/proctor/sessions/${sessionId}/event`, data),
  analyzeFrame: (sessionId, data) => api.post(`/proctor/sessions/${sessionId}/analyze`, data),
  updateState: (sessionId, data) => api.put(`/proctor/sessions/${sessionId}/state`, data),
  endSession: (sessionId) => api.post(`/proctor/sessions/${sessionId}/end`),
  getSession: (sessionId) => api.get(`/proctor/sessions/${sessionId}`),
};
