import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Home, 
  BookOpen, 
  Trophy, 
  User, 
  Settings, 
  LogOut,
  Coins,
  Star,
  Flame,
  ShoppingBag,
  Globe
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useGamificationStore } from '../stores/gamificationStore';

const Layout = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { instructionLanguage, setInstructionLanguage } = useSettingsStore();
  const { level, xp, xpToNextLevel, coins, currentStreak } = useGamificationStore();

  const navItems = [
    { path: '/dashboard', icon: Home, label: t('nav.home') },
    { path: '/courses', icon: BookOpen, label: t('nav.learn') },
    { path: '/compete', icon: Trophy, label: t('nav.compete') },
    { path: '/leaderboard', icon: Star, label: t('compete.leaderboard') },
    { path: '/shop', icon: ShoppingBag, label: 'Shop' },
    { path: '/profile', icon: User, label: t('nav.profile') },
  ];

  const toggleLanguage = () => {
    setInstructionLanguage(instructionLanguage === 'en' ? 'ur' : 'en');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-700">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">&lt;/&gt;</span>
            </div>
            <span className="text-xl font-bold gradient-text">CodeHub</span>
          </Link>
        </div>

        {/* User Stats */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-lg font-bold">{user?.username?.[0]?.toUpperCase() || 'U'}</span>
            </div>
            <div>
              <p className="font-medium">{user?.username || 'User'}</p>
              <p className="text-sm text-gray-400">Level {level}</p>
            </div>
          </div>
          
          {/* XP Progress */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>XP</span>
              <span>{xp} / {xpToNextLevel}</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                initial={{ width: 0 }}
                animate={{ width: `${(xp / xpToNextLevel) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-1 text-yellow-400">
              <Coins size={16} />
              <span>{coins}</span>
            </div>
            <div className="flex items-center gap-1 text-orange-400">
              <Flame size={16} />
              <span>{currentStreak} days</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-3 px-4 py-2 w-full text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Globe size={20} />
            <span>{instructionLanguage === 'en' ? 'اردو' : 'English'}</span>
          </button>
          
          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2 w-full text-red-400 hover:text-red-300 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>{t('auth.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
