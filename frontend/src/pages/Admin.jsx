import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  Trophy, 
  Calendar,
  Plus,
  Edit,
  Trash2,
  Settings,
  BarChart3,
  Loader2,
  Clock,
  Target,
  Search,
  X,
  Check,
  ExternalLink
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

const Admin = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [showContestForm, setShowContestForm] = useState(false);
  const [problemSearch, setProblemSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Contest form state
  const [contestForm, setContestForm] = useState({
    title: '',
    description: '',
    start_time: '',
    duration_minutes: 120,
    difficulty: 'mixed',
    contest_type: 'rated',
    is_public: true,
    max_participants: null,
    problems: [] // Array of Codeforces problems
  });

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => api.get('/admin/stats').then(res => res.data),
    retry: 1
  });

  // Fetch contests
  const { data: contests, isLoading: contestsLoading, error: contestsError } = useQuery({
    queryKey: ['adminContests'],
    queryFn: () => api.get('/admin/contests').then(res => res.data),
    retry: 1
  });

  // Fetch users
  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => api.get('/admin/users').then(res => res.data),
    retry: 1
  });

  // Create contest mutation
  const createContestMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Mutation function called with:', data);
      try {
        const response = await api.post('/admin/contests', data);
        console.log('Contest created successfully:', response.data);
        return response.data;
      } catch (err) {
        console.error('API Error:', err);
        console.error('Error Response:', err.response?.data);
        throw err;
      }
    }
  });

  const resetContestForm = () => {
    setContestForm({
      title: '',
      description: '',
      start_time: '',
      duration_minutes: 120,
      difficulty: 'mixed',
      contest_type: 'rated',
      is_public: true,
      max_participants: null,
      problems: []
    });
    setProblemSearch('');
    setSearchResults([]);
  };

  // Search Codeforces problems
  const searchCodeforcesProblems = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await api.get(`/codeforces/problems/search?query=${encodeURIComponent(query)}&limit=15`);
      setSearchResults(response.data.problems || []);
    } catch (error) {
      console.error('Failed to search problems:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  const handleProblemSearchChange = (value) => {
    setProblemSearch(value);
    clearTimeout(window.problemSearchTimeout);
    window.problemSearchTimeout = setTimeout(() => {
      searchCodeforcesProblems(value);
    }, 300);
  };

  // Add problem to contest
  const addProblemToContest = (problem) => {
    if (contestForm.problems.some(p => p.contest_id === problem.contest_id && p.index === problem.index)) {
      toast.error('Problem already added');
      return;
    }
    setContestForm({
      ...contestForm,
      problems: [...contestForm.problems, problem]
    });
    setProblemSearch('');
    setSearchResults([]);
    toast.success(`Added: ${problem.name}`);
  };

  // Remove problem from contest
  const removeProblemFromContest = (problem) => {
    setContestForm({
      ...contestForm,
      problems: contestForm.problems.filter(p => 
        !(p.contest_id === problem.contest_id && p.index === problem.index)
      )
    });
  };

  // Get difficulty color
  const getDifficultyColor = (rating) => {
    if (!rating) return 'bg-gray-500';
    if (rating < 1200) return 'bg-green-500';
    if (rating < 1400) return 'bg-cyan-500';
    if (rating < 1600) return 'bg-blue-500';
    if (rating < 1900) return 'bg-purple-500';
    if (rating < 2100) return 'bg-yellow-500';
    if (rating < 2400) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const handleContestSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== Contest Submit Started ===');
    console.log('Contest Form:', contestForm);
    
    // Validate that problems are added
    if (contestForm.problems.length === 0) {
      console.error('No problems added');
      toast.error('Please add at least one problem to the contest');
      return;
    }
    
    try {
      // Format the contest data properly and ensure types are correct
      const contestData = {
        title: contestForm.title,
        description: contestForm.description,
        start_time: new Date(contestForm.start_time).toISOString(),
        duration_minutes: parseInt(contestForm.duration_minutes),
        difficulty: contestForm.difficulty,
        contest_type: contestForm.contest_type,
        is_public: contestForm.is_public,
        max_participants: contestForm.max_participants || null,
        problems: contestForm.problems.map(p => ({
          contest_id: parseInt(p.contest_id),
          index: p.index,
          name: p.name,
          rating: p.rating ? parseInt(p.rating) : null,
          tags: Array.isArray(p.tags) ? p.tags : []
        }))
      };
      
      console.log('=== Submitting Contest Data ===', contestData);
      console.log('Problems array:', JSON.stringify(contestData.problems, null, 2));
      
      // Submit mutation
      const result = await createContestMutation.mutateAsync(contestData);
      
      // Success - only execute if mutation succeeds
      console.log('=== Contest Submit Completed ===', result);
      toast.success('Contest created successfully! Notification sent to all users.');
      
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['adminContests'] });
      await queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      await queryClient.invalidateQueries({ queryKey: ['contests'] });
      
      // Reset form and close modal
      setShowContestForm(false);
      resetContestForm();
      
    } catch (error) {
      console.error('=== Contest Submit Error ===');
      console.error('Error:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      toast.error(error.response?.data?.detail || error.message || 'Failed to create contest');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'contests', label: 'Contests', icon: Trophy },
    { id: 'users', label: 'Users', icon: Users },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400">Manage your platform</p>
        </div>
        <button
          onClick={() => setShowContestForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
          <span>Create Contest</span>
        </button>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Users className="text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">
                  {statsLoading ? '...' : stats?.total_users || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Trophy className="text-purple-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Contests</p>
                <p className="text-2xl font-bold text-white">
                  {statsLoading ? '...' : stats?.total_contests || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Target className="text-green-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Active Today</p>
                <p className="text-2xl font-bold text-white">
                  {statsLoading ? '...' : stats?.active_users_today || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="text-yellow-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Upcoming Contests</p>
                <p className="text-2xl font-bold text-white">
                  {statsLoading ? '...' : stats?.pending_contests || 0}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Contests Tab */}
      {activeTab === 'contests' && (
        <div className="space-y-4">
          {contestsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : contests?.length > 0 ? (
            <div className="grid gap-4">
              {contests.map((contest, index) => (
                <motion.div
                  key={contest.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      contest.status === 'ongoing' ? 'bg-green-500' :
                      contest.status === 'upcoming' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`} />
                    <div>
                      <h3 className="font-semibold text-white">{contest.title}</h3>
                      <p className="text-sm text-gray-400">
                        {new Date(contest.start_time).toLocaleString()} • {contest.duration_minutes} mins • {contest.difficulty}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      contest.status === 'ongoing' ? 'bg-green-500/20 text-green-400' :
                      contest.status === 'upcoming' ? 'bg-yellow-500/20 text-yellow-400' : 
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {contest.status}
                    </span>
                    <span className="text-gray-400 text-sm">{contest.registered_count} registered</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No contests found. Create your first contest!
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          {usersLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="text-left p-4 text-gray-400 font-medium">User</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Email</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Role</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {usersData?.users?.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-700/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                          {u.username[0].toUpperCase()}
                        </div>
                        <span className="text-white">{u.username}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-400">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        u.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Contest Form Modal */}
      {showContestForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create New Contest</h2>
              <button
                onClick={() => { setShowContestForm(false); resetContestForm(); }}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleContestSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Basic Information</h3>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Title</label>
                  <input
                    type="text"
                    value={contestForm.title}
                    onChange={(e) => setContestForm({...contestForm, title: e.target.value})}
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Weekly Challenge #1"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Description</label>
                  <textarea
                    value={contestForm.description}
                    onChange={(e) => setContestForm({...contestForm, description: e.target.value})}
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-24 resize-none"
                    placeholder="Describe the contest..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Start Time</label>
                    <input
                      type="datetime-local"
                      value={contestForm.start_time}
                      onChange={(e) => setContestForm({...contestForm, start_time: e.target.value})}
                      required
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Duration (minutes)</label>
                    <input
                      type="number"
                      value={contestForm.duration_minutes}
                      onChange={(e) => setContestForm({...contestForm, duration_minutes: parseInt(e.target.value)})}
                      required
                      min={30}
                      max={480}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Difficulty</label>
                    <select
                      value={contestForm.difficulty}
                      onChange={(e) => setContestForm({...contestForm, difficulty: e.target.value})}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Contest Type</label>
                    <select
                      value={contestForm.contest_type}
                      onChange={(e) => setContestForm({...contestForm, contest_type: e.target.value})}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="rated">Rated</option>
                      <option value="unrated">Unrated</option>
                      <option value="practice">Practice</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contestForm.is_public}
                      onChange={(e) => setContestForm({...contestForm, is_public: e.target.checked})}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-gray-300">Public Contest</span>
                  </label>
                </div>
              </div>

              {/* Problems Section */}
              <div className="space-y-4 border-t border-gray-700 pt-6">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Trophy size={16} />
                  Contest Problems (from Codeforces)
                </h3>

                {/* Problem Search */}
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={problemSearch}
                      onChange={(e) => handleProblemSearchChange(e.target.value)}
                      placeholder="Search Codeforces problems by name or ID..."
                      className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                    )}
                  </div>

                  {/* Search Results Dropdown */}
                  <AnimatePresence>
                    {searchResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 w-full mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                      >
                        {searchResults.map((problem) => (
                          <button
                            key={`${problem.contest_id}-${problem.index}`}
                            type="button"
                            onClick={() => addProblemToContest(problem)}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800 transition-colors text-left border-b border-gray-700/50 last:border-b-0"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-gray-500 font-mono text-sm">
                                {problem.contest_id}{problem.index}
                              </span>
                              <span className="text-white truncate max-w-xs">{problem.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getDifficultyColor(problem.rating)}`} />
                              <span className="text-gray-400 text-sm">{problem.rating || 'N/A'}</span>
                              <Plus size={16} className="text-green-400" />
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Selected Problems */}
                {contestForm.problems.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">
                      {contestForm.problems.length} problem{contestForm.problems.length > 1 ? 's' : ''} selected
                    </p>
                    <div className="space-y-2">
                      {contestForm.problems.map((problem, index) => (
                        <motion.div
                          key={`${problem.contest_id}-${problem.index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            <span className="text-gray-500 font-mono text-sm">
                              {problem.contest_id}{problem.index}
                            </span>
                            <span className="text-white">{problem.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getDifficultyColor(problem.rating)}`} />
                              <span className="text-gray-400 text-sm">{problem.rating || 'N/A'}</span>
                            </div>
                            <a
                              href={`https://codeforces.com/problemset/problem/${problem.contest_id}/${problem.index}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-blue-400"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink size={16} />
                            </a>
                            <button
                              type="button"
                              onClick={() => removeProblemFromContest(problem)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {contestForm.problems.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4 bg-gray-900/30 rounded-lg border border-dashed border-gray-700">
                    No problems added yet. Search and add Codeforces problems above.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => { setShowContestForm(false); resetContestForm(); }}
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createContestMutation.isPending}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                >
                  {createContestMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Plus size={20} />
                  )}
                  <span>Create Contest</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Admin;
