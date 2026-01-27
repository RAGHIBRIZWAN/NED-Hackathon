import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  User, 
  Mail,
  BookOpen,
  Code,
  Trophy,
  Flame,
  Star,
  Settings,
  Camera,
  Save,
  Award
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useGamificationStore } from '../stores/gamificationStore';
import { useSettingsStore } from '../stores/settingsStore';
import { authAPI, gamifyAPI } from '../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const { level, xp, xpToNextLevel, coins, currentStreak, badges } = useGamificationStore();
  const { programmingLanguage, instructionLanguage, setProgrammingLanguage, setInstructionLanguage } = useSettingsStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    username: user?.username || '',
    bio: user?.bio || '',
  });

  // Fetch achievements
  const { data: achievementsData } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => gamifyAPI.getAchievements(),
  });

  const achievements = achievementsData?.data?.achievements || [];

  const handleSave = async () => {
    try {
      const response = await authAPI.updateProfile(formData);
      updateUser(response.data);
      setIsEditing(false);
      toast.success('Profile updated!');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const stats = [
    { icon: BookOpen, label: 'Lessons Completed', value: user?.stats?.lessons_completed || 0, color: 'text-blue-400' },
    { icon: Code, label: 'Challenges Solved', value: user?.stats?.challenges_solved || 0, color: 'text-purple-400' },
    { icon: Trophy, label: 'Contests Won', value: user?.stats?.contests_won || 0, color: 'text-yellow-400' },
    { icon: Flame, label: 'Current Streak', value: currentStreak, color: 'text-orange-400' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 border border-gray-700 rounded-2xl p-8 mb-6"
      >
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
              {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <Camera size={16} className="text-white" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="Full Name"
                />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="Username"
                />
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="Bio"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
                  >
                    <Save size={16} />
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold text-white">{user?.full_name || 'User'}</h1>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                    Level {level}
                  </span>
                </div>
                <p className="text-gray-400">@{user?.username}</p>
                <p className="text-gray-500 mt-2">{user?.bio || 'No bio yet'}</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  <Settings size={16} />
                  Edit Profile
                </button>
              </>
            )}
          </div>

          {/* XP Progress */}
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <Star className="text-yellow-400" size={20} />
              <span className="text-yellow-400 font-bold text-xl">{xp} XP</span>
            </div>
            <p className="text-gray-500 text-sm">{xpToNextLevel - xp} to Level {level + 1}</p>
            <div className="w-48 h-2 bg-gray-700 rounded-full mt-2">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                style={{ width: `${(xp / xpToNextLevel) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center"
          >
            <stat.icon className={`${stat.color} mx-auto mb-2`} size={24} />
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-gray-500 text-sm">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Settings */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6"
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Settings size={20} />
          Preferences
        </h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Programming Language
            </label>
            <select
              value={programmingLanguage}
              onChange={(e) => setProgrammingLanguage(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
            >
              <option value="python">🐍 Python</option>
              <option value="cpp">⚡ C++</option>
              <option value="javascript">🌐 JavaScript</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Instruction Language
            </label>
            <select
              value={instructionLanguage}
              onChange={(e) => setInstructionLanguage(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
            >
              <option value="en">🇬🇧 English</option>
              <option value="ur">🇵🇰 اردو</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-800 border border-gray-700 rounded-xl p-6"
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Award size={20} className="text-yellow-400" />
          Badges
        </h2>
        
        <div className="grid grid-cols-6 gap-4">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl flex items-center justify-center text-3xl">
                {badge.icon}
              </div>
              <p className="text-white text-sm mt-2">{badge.name}</p>
            </motion.div>
          ))}
          
          {badges.length === 0 && (
            <div className="col-span-6 text-center py-8 text-gray-500">
              <Award size={48} className="mx-auto mb-2 opacity-50" />
              <p>No badges earned yet. Keep learning!</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
