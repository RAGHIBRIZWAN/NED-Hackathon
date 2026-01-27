import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      "nav.home": "Home",
      "nav.learn": "Learn",
      "nav.practice": "Practice",
      "nav.compete": "Compete",
      "nav.profile": "Profile",
      
      // Auth
      "auth.login": "Login",
      "auth.register": "Register",
      "auth.logout": "Logout",
      "auth.email": "Email",
      "auth.password": "Password",
      "auth.username": "Username",
      "auth.fullName": "Full Name",
      
      // Home
      "home.title": "Learn Programming with AI",
      "home.subtitle": "Master C++, Python, and JavaScript with gamified lessons and bilingual AI tutoring",
      "home.getStarted": "Get Started",
      "home.features.learn": "Learn",
      "home.features.practice": "Practice",
      "home.features.compete": "Compete",
      "home.features.reward": "Reward",
      
      // Lessons
      "lessons.title": "Courses",
      "lessons.startLesson": "Start Lesson",
      "lessons.continueLesson": "Continue",
      "lessons.completed": "Completed",
      "lessons.progress": "Progress",
      
      // Code Editor
      "editor.run": "Run Code",
      "editor.submit": "Submit",
      "editor.reset": "Reset",
      "editor.language": "Language",
      "editor.output": "Output",
      "editor.input": "Input",
      
      // AI Tutor
      "ai.title": "AI Tutor",
      "ai.askQuestion": "Ask a question...",
      "ai.speak": "Speak",
      "ai.listening": "Listening...",
      "ai.thinking": "Thinking...",
      
      // MCQ
      "mcq.title": "Quiz",
      "mcq.question": "Question",
      "mcq.submit": "Submit Answer",
      "mcq.next": "Next Question",
      "mcq.result": "Your Score",
      
      // Gamification
      "gamify.coins": "Coins",
      "gamify.level": "Level",
      "gamify.xp": "XP",
      "gamify.streak": "Day Streak",
      "gamify.badges": "Badges",
      "gamify.achievements": "Achievements",
      "gamify.dailyReward": "Claim Daily Reward",
      
      // Competitions
      "compete.title": "Competitions",
      "compete.upcoming": "Upcoming",
      "compete.ongoing": "Ongoing",
      "compete.completed": "Completed",
      "compete.register": "Register",
      "compete.leaderboard": "Leaderboard",
      "compete.rating": "Rating",
      
      // Proctoring
      "proctor.examMode": "Exam Mode",
      "proctor.webcamRequired": "Webcam Required",
      "proctor.warning": "Warning",
      "proctor.tabSwitch": "Tab switch detected",
      "proctor.faceNotDetected": "Face not detected",
      
      // Common
      "common.loading": "Loading...",
      "common.error": "An error occurred",
      "common.save": "Save",
      "common.cancel": "Cancel",
      "common.confirm": "Confirm",
      "common.success": "Success!",
    }
  },
  ur: {
    translation: {
      // Navigation
      "nav.home": "ہوم",
      "nav.learn": "سیکھیں",
      "nav.practice": "مشق",
      "nav.compete": "مقابلہ",
      "nav.profile": "پروفائل",
      
      // Auth
      "auth.login": "لاگ ان",
      "auth.register": "رجسٹر",
      "auth.logout": "لاگ آؤٹ",
      "auth.email": "ای میل",
      "auth.password": "پاس ورڈ",
      "auth.username": "صارف نام",
      "auth.fullName": "پورا نام",
      
      // Home
      "home.title": "AI کے ساتھ پروگرامنگ سیکھیں",
      "home.subtitle": "گیمیفائیڈ اسباق اور دو لسانی AI ٹیوٹرنگ کے ساتھ C++، Python، اور JavaScript میں مہارت حاصل کریں",
      "home.getStarted": "شروع کریں",
      "home.features.learn": "سیکھیں",
      "home.features.practice": "مشق کریں",
      "home.features.compete": "مقابلہ کریں",
      "home.features.reward": "انعام",
      
      // Lessons
      "lessons.title": "کورسز",
      "lessons.startLesson": "سبق شروع کریں",
      "lessons.continueLesson": "جاری رکھیں",
      "lessons.completed": "مکمل",
      "lessons.progress": "پیشرفت",
      
      // Code Editor
      "editor.run": "کوڈ چلائیں",
      "editor.submit": "جمع کرائیں",
      "editor.reset": "ری سیٹ",
      "editor.language": "زبان",
      "editor.output": "آؤٹ پٹ",
      "editor.input": "ان پٹ",
      
      // AI Tutor
      "ai.title": "AI ٹیوٹر",
      "ai.askQuestion": "سوال پوچھیں...",
      "ai.speak": "بولیں",
      "ai.listening": "سن رہا ہے...",
      "ai.thinking": "سوچ رہا ہے...",
      
      // MCQ
      "mcq.title": "کوئز",
      "mcq.question": "سوال",
      "mcq.submit": "جواب جمع کرائیں",
      "mcq.next": "اگلا سوال",
      "mcq.result": "آپ کا سکور",
      
      // Gamification
      "gamify.coins": "سکے",
      "gamify.level": "درجہ",
      "gamify.xp": "ایکس پی",
      "gamify.streak": "دن کی سلسلہ",
      "gamify.badges": "بیجز",
      "gamify.achievements": "کامیابیاں",
      "gamify.dailyReward": "روزانہ انعام حاصل کریں",
      
      // Competitions
      "compete.title": "مقابلے",
      "compete.upcoming": "آنے والے",
      "compete.ongoing": "جاری",
      "compete.completed": "مکمل",
      "compete.register": "رجسٹر کریں",
      "compete.leaderboard": "لیڈر بورڈ",
      "compete.rating": "ریٹنگ",
      
      // Proctoring
      "proctor.examMode": "امتحان موڈ",
      "proctor.webcamRequired": "ویب کیم ضروری ہے",
      "proctor.warning": "انتباہ",
      "proctor.tabSwitch": "ٹیب سوئچ کا پتہ چلا",
      "proctor.faceNotDetected": "چہرہ نہیں ملا",
      
      // Common
      "common.loading": "لوڈ ہو رہا ہے...",
      "common.error": "ایک خرابی پیش آ گئی",
      "common.save": "محفوظ کریں",
      "common.cancel": "منسوخ کریں",
      "common.confirm": "تصدیق کریں",
      "common.success": "کامیابی!",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
