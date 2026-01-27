import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Code, 
  Trophy, 
  Gift, 
  Sparkles,
  Users,
  Globe,
  Play
} from 'lucide-react';

const Home = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: BookOpen,
      title: t('home.features.learn'),
      titleUr: 'سیکھیں',
      description: 'Interactive lessons in C++, Python & JavaScript',
      descriptionUr: 'C++، Python اور JavaScript میں انٹرایکٹو اسباق',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Code,
      title: t('home.features.practice'),
      titleUr: 'مشق کریں',
      description: 'Solve coding challenges with real-time feedback',
      descriptionUr: 'ریئل ٹائم فیڈبیک کے ساتھ کوڈنگ چیلنجز حل کریں',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Trophy,
      title: t('home.features.compete'),
      titleUr: 'مقابلہ کریں',
      description: 'Join contests and climb the leaderboard',
      descriptionUr: 'مقابلوں میں شامل ہوں اور لیڈر بورڈ پر چڑھیں',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: Gift,
      title: t('home.features.reward'),
      titleUr: 'انعام',
      description: 'Earn coins, badges, and unlock themes',
      descriptionUr: 'سکے، بیجز حاصل کریں اور تھیمز کھولیں',
      color: 'from-green-500 to-emerald-500',
    },
  ];

  const stats = [
    { value: '1000+', label: 'Coding Challenges', labelUr: 'کوڈنگ چیلنجز' },
    { value: '50+', label: 'Interactive Lessons', labelUr: 'انٹرایکٹو اسباق' },
    { value: '10k+', label: 'Active Learners', labelUr: 'فعال سیکھنے والے' },
    { value: '24/7', label: 'AI Tutor Support', labelUr: 'AI ٹیوٹر سپورٹ' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">&lt;/&gt;</span>
              </div>
              <span className="text-xl font-bold text-white">CodeHub</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link 
                to="/login" 
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                {t('auth.login')}
              </Link>
              <Link 
                to="/register" 
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                {t('auth.register')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-sm">AI-Powered Learning Platform</span>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="text-white">{t('home.title')}</span>
            </h1>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-urdu text-gray-400">
              AI کے ساتھ پروگرامنگ سیکھیں
            </h2>

            {/* Subtitle */}
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-4">
              {t('home.subtitle')}
            </p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8 font-urdu">
              گیمیفائیڈ اسباق اور دو لسانی AI ٹیوٹرنگ کے ساتھ C++، Python، اور JavaScript سیکھیں
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                <Play size={20} />
                {t('home.getStarted')}
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-800 text-white text-lg font-semibold rounded-xl hover:bg-gray-700 transition-colors border border-gray-700"
              >
                <Globe size={20} />
                Explore Platform
              </Link>
            </div>
          </motion.div>

          {/* Language Support Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex items-center justify-center gap-4"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
              <span className="text-green-400">🇵🇰</span>
              <span className="text-green-400">اردو سپورٹ</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <span className="text-blue-400">🇬🇧</span>
              <span className="text-blue-400">English Support</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Learn → Practice → Compete → Reward
            </h2>
            <p className="text-gray-400">
              The complete learning loop for programming mastery
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6 hover:border-gray-600 transition-colors"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{feature.title}</h3>
                <h4 className="text-lg font-urdu text-gray-400 mb-2">{feature.titleUr}</h4>
                <p className="text-gray-400 text-sm mb-1">{feature.description}</p>
                <p className="text-gray-500 text-sm font-urdu">{feature.descriptionUr}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-gray-800/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400">{stat.label}</div>
                <div className="text-gray-500 font-urdu text-sm">{stat.labelUr}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Tutor Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-3xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  🤖 AI Tutor - Your Personal Programming Guide
                </h2>
                <h3 className="text-2xl font-urdu text-gray-300 mb-6">
                  AI ٹیوٹر - آپ کا ذاتی پروگرامنگ گائیڈ
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-gray-300">
                    <span className="text-green-400">✓</span>
                    <span>Bilingual support (English & Urdu)</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <span className="text-green-400">✓</span>
                    <span>Voice explanations for concepts</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <span className="text-green-400">✓</span>
                    <span>Real-time code error detection</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <span className="text-green-400">✓</span>
                    <span>Beginner-friendly explanations</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span>🤖</span>
                  </div>
                  <div className="flex-1 bg-gray-700 rounded-lg p-4">
                    <p className="text-white mb-2">
                      Great question! Let me explain how loops work...
                    </p>
                    <p className="text-gray-400 font-urdu">
                      بہت اچھا سوال! مجھے بتانے دیں کہ لوپس کیسے کام کرتے ہیں...
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-colors">
                    🎤 Ask with Voice
                  </button>
                  <button className="flex-1 py-2 bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/30 hover:bg-purple-500/30 transition-colors">
                    🔊 Hear Explanation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Start Your Coding Journey?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of students learning to code with AI
          </p>
          <Link 
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Start Learning Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-800">
        <div className="container mx-auto text-center text-gray-500">
          <p>Made with ❤️ by Team AI CHAMPS</p>
          <p className="font-urdu mt-2">پاکستانی ڈویلپرز کی اگلی نسل کو بااختیار بنانا</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
