import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  BookOpen, 
  Clock, 
  Star, 
  ChevronRight,
  Lock,
  Check,
  Play
} from 'lucide-react';
import { lessonsAPI } from '../services/api';

const Courses = () => {
  const { t } = useTranslation();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);

  // Fetch courses
  const { data: coursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: () => lessonsAPI.getCourses(),
  });

  // Fetch modules for selected course
  const { data: modulesData } = useQuery({
    queryKey: ['modules', selectedCourse],
    queryFn: () => lessonsAPI.getModules(selectedCourse),
    enabled: !!selectedCourse,
  });

  // Fetch lessons
  const { data: lessonsData } = useQuery({
    queryKey: ['lessons', selectedCourse, selectedModule],
    queryFn: () => lessonsAPI.getLessons({ 
      course_id: selectedCourse, 
      module_id: selectedModule 
    }),
    enabled: !!selectedCourse,
  });

  const courses = coursesData?.data?.courses || [];
  const modules = modulesData?.data?.modules || [];
  const lessons = lessonsData?.data?.lessons || [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{t('lessons.title')}</h1>
        <p className="text-gray-400">Choose a course and start learning</p>
      </div>

      {/* Course Selection */}
      {!selectedCourse ? (
        <div className="grid md:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedCourse(course.id)}
              className="bg-gray-800 border border-gray-700 rounded-2xl p-6 cursor-pointer hover:border-blue-500 transition-colors"
            >
              <div className="text-5xl mb-4">{course.icon}</div>
              <h3 className="text-xl font-bold text-white mb-1">{course.name}</h3>
              <h4 className="text-lg font-urdu text-gray-400 mb-3">{course.name_ur}</h4>
              <p className="text-gray-400 text-sm mb-4">{course.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <BookOpen size={16} />
                  {course.total_lessons} lessons
                </span>
                <span className="flex items-center gap-1">
                  <Star size={16} />
                  {course.difficulty}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div>
          {/* Back Button */}
          <button
            onClick={() => {
              setSelectedCourse(null);
              setSelectedModule(null);
            }}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6"
          >
            ← Back to Courses
          </button>

          <div className="grid md:grid-cols-4 gap-6">
            {/* Modules Sidebar */}
            <div className="md:col-span-1">
              <h2 className="text-lg font-bold text-white mb-4">Modules</h2>
              <div className="space-y-2">
                {modules.map((module) => (
                  <button
                    key={module.id}
                    onClick={() => setSelectedModule(module.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedModule === module.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <span className="block text-sm">{module.name}</span>
                    <span className="block text-xs font-urdu opacity-75">{module.name_ur}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Lessons Grid */}
            <div className="md:col-span-3">
              <h2 className="text-lg font-bold text-white mb-4">
                {selectedModule ? 'Lessons' : 'Select a Module'}
              </h2>
              
              {lessons.length > 0 ? (
                <div className="space-y-3">
                  {lessons.map((lesson, index) => (
                    <motion.div
                      key={lesson.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        to={`/lesson/${lesson.slug}`}
                        className="flex items-center gap-4 p-4 bg-gray-800 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          lesson.completed 
                            ? 'bg-green-500/20' 
                            : 'bg-blue-500/20'
                        }`}>
                          {lesson.completed ? (
                            <Check className="text-green-400" size={20} />
                          ) : (
                            <Play className="text-blue-400" size={20} />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-medium">{lesson.title}</h3>
                          {lesson.title_ur && (
                            <span className="text-gray-500 text-sm font-urdu">
                              {lesson.title_ur}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {lesson.estimated_minutes}m
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            lesson.difficulty === 'beginner' 
                              ? 'bg-green-500/20 text-green-400'
                              : lesson.difficulty === 'intermediate'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {lesson.difficulty}
                          </span>
                          <span className="text-yellow-400">
                            +{lesson.xp_reward} XP
                          </span>
                        </div>
                        <ChevronRight className="text-gray-500" size={20} />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Select a module to see lessons</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;
