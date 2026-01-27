import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  Trophy, 
  Clock, 
  Users,
  Calendar,
  ArrowRight,
  Star,
  Zap,
  Lock
} from 'lucide-react';
import { competeAPI } from '../services/api';

const Compete = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all'); // all, upcoming, active, past

  // Fetch contests
  const { data: contestsData, isLoading } = useQuery({
    queryKey: ['contests', filter],
    queryFn: () => competeAPI.getContests(filter !== 'all' ? filter : undefined),
  });

  const contests = contestsData?.data?.contests || [];

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500/20 text-blue-400';
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'ended': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="text-yellow-400" />
          {t('compete.title')}
        </h1>
        <p className="text-gray-400 mt-1">{t('compete.subtitle')}</p>
      </div>

      {/* User Rating Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-200 text-sm mb-1">Your Rating</p>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold text-white">1500</span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm">
                Beginner
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-purple-200 text-sm mb-1">Contests Participated</p>
            <span className="text-2xl font-bold text-white">0</span>
          </div>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {['all', 'upcoming', 'active', 'past'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Contests Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : contests.length === 0 ? (
        <div className="text-center py-12">
          <Trophy size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No contests found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contests.map((contest, index) => (
            <motion.div
              key={contest.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-colors"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(contest.status)}`}>
                      {contest.status}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-2">{contest.title}</h3>
                    {contest.title_ur && (
                      <p className="text-gray-500 text-sm font-urdu">{contest.title_ur}</p>
                    )}
                  </div>
                  {contest.is_rated && (
                    <Star className="text-yellow-400" size={20} />
                  )}
                </div>

                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {contest.description}
                </p>

                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>Starts: {formatDate(contest.start_time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>Duration: {contest.duration_minutes} mins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    <span>{contest.participant_count || 0} participants</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  {contest.problems?.map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-gray-400 text-sm"
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-700 p-4">
                {contest.status === 'active' ? (
                  <Link
                    to={`/contest/${contest.id}`}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-500"
                  >
                    <Zap size={18} />
                    Enter Contest
                  </Link>
                ) : contest.status === 'upcoming' ? (
                  <button
                    className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
                  >
                    <Clock size={18} />
                    Register
                  </button>
                ) : (
                  <Link
                    to={`/contest/${contest.id}`}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                  >
                    View Results
                    <ArrowRight size={18} />
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 grid md:grid-cols-3 gap-6"
      >
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
            <Trophy className="text-blue-400" size={24} />
          </div>
          <h3 className="text-white font-semibold mb-2">Compete & Win</h3>
          <p className="text-gray-400 text-sm">
            Join contests to test your skills against other programmers and climb the leaderboard.
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
            <Star className="text-green-400" size={24} />
          </div>
          <h3 className="text-white font-semibold mb-2">ELO Rating</h3>
          <p className="text-gray-400 text-sm">
            Your rating reflects your skill level. Win contests to increase your rating.
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
            <Zap className="text-yellow-400" size={24} />
          </div>
          <h3 className="text-white font-semibold mb-2">Earn Rewards</h3>
          <p className="text-gray-400 text-sm">
            Top performers earn bonus coins, exclusive badges, and special themes.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Compete;
