import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  Tag,
  Users,
  Star,
  X,
  SlidersHorizontal
} from 'lucide-react';
import api from '../services/api';

// Difficulty color mapping based on Codeforces ratings
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

const getDifficultyLabel = (rating) => {
  if (!rating) return 'Unrated';
  if (rating < 1200) return 'Newbie';
  if (rating < 1400) return 'Pupil';
  if (rating < 1600) return 'Specialist';
  if (rating < 1900) return 'Expert';
  if (rating < 2100) return 'Candidate Master';
  if (rating < 2400) return 'Master';
  return 'Grandmaster';
};

// Popular tags for quick filter
const POPULAR_TAGS = [
  'implementation',
  'math',
  'greedy',
  'dp',
  'data structures',
  'binary search',
  'graphs',
  'strings',
  'sortings',
  'number theory',
  'trees',
  'two pointers'
];

export default function Practice() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [ratingMin, setRatingMin] = useState('');
  const [ratingMax, setRatingMax] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Debounce search
  const handleSearchChange = (value) => {
    setSearch(value);
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 500);
  };
  
  // Build query params
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', '20');
    
    if (ratingMin) params.append('rating_min', ratingMin);
    if (ratingMax) params.append('rating_max', ratingMax);
    if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));
    if (debouncedSearch) params.append('search', debouncedSearch);
    
    return params.toString();
  };
  
  // Fetch problems
  const { data, isLoading, error } = useQuery({
    queryKey: ['codeforces-problems', page, ratingMin, ratingMax, selectedTags, debouncedSearch],
    queryFn: async () => {
      const response = await api.get(`/codeforces/problems?${buildQueryParams()}`);
      return response.data;
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  // Fetch tags
  const { data: tagsData } = useQuery({
    queryKey: ['codeforces-tags'],
    queryFn: async () => {
      const response = await api.get('/codeforces/problems/tags');
      return response.data;
    },
    staleTime: 30 * 60 * 1000 // 30 minutes
  });
  
  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
    setPage(1);
  };
  
  const clearFilters = () => {
    setRatingMin('');
    setRatingMax('');
    setSelectedTags([]);
    setSearch('');
    setDebouncedSearch('');
    setPage(1);
  };
  
  const openProblem = (contestId, index) => {
    window.open(`https://codeforces.com/problemset/problem/${contestId}/${index}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Practice Problems
          </h1>
          <p className="text-gray-400">
            Solve problems from Codeforces to sharpen your competitive programming skills
          </p>
        </motion.div>

        {/* Search and Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-gray-700/50"
        >
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search problems by name..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                showFilters || selectedTags.length > 0 || ratingMin || ratingMax
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-gray-900/50 border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span>Filters</span>
              {(selectedTags.length > 0 || ratingMin || ratingMax) && (
                <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                  {selectedTags.length + (ratingMin ? 1 : 0) + (ratingMax ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Clear Filters */}
            {(selectedTags.length > 0 || ratingMin || ratingMax || debouncedSearch) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 hover:text-red-300 transition-colors"
              >
                <X className="w-5 h-5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 mt-4 border-t border-gray-700">
                  {/* Rating Range */}
                  <div className="mb-4">
                    <label className="text-sm text-gray-400 mb-2 block">Rating Range</label>
                    <div className="flex gap-4 items-center">
                      <input
                        type="number"
                        value={ratingMin}
                        onChange={(e) => { setRatingMin(e.target.value); setPage(1); }}
                        placeholder="Min (800)"
                        min="800"
                        max="3500"
                        step="100"
                        className="w-32 px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="number"
                        value={ratingMax}
                        onChange={(e) => { setRatingMax(e.target.value); setPage(1); }}
                        placeholder="Max (3500)"
                        min="800"
                        max="3500"
                        step="100"
                        className="w-32 px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Popular Tags */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Popular Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_TAGS.map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                            selectedTags.includes(tag)
                              ? 'bg-primary text-white'
                              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* All Tags */}
                  {tagsData?.tags && (
                    <div className="mt-4">
                      <label className="text-sm text-gray-400 mb-2 block">All Tags</label>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {tagsData.tags
                          .filter(t => !POPULAR_TAGS.includes(t.name))
                          .map(tag => (
                            <button
                              key={tag.name}
                              onClick={() => toggleTag(tag.name)}
                              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                                selectedTags.includes(tag.name)
                                  ? 'bg-primary text-white'
                                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                              }`}
                            >
                              {tag.name} ({tag.count})
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Active Filters Display */}
        {selectedTags.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap gap-2 mb-4"
          >
            {selectedTags.map(tag => (
              <span
                key={tag}
                className="flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm"
              >
                <Tag className="w-3 h-3" />
                {tag}
                <button
                  onClick={() => toggleTag(tag)}
                  className="ml-1 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </motion.div>
        )}

        {/* Results Info */}
        {data && (
          <div className="text-gray-400 text-sm mb-4">
            Showing {((page - 1) * 20) + 1}-{Math.min(page * 20, data.total)} of {data.total.toLocaleString()} problems
          </div>
        )}

        {/* Problems List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6 text-center">
            <p className="text-red-400">Failed to load problems. Please try again later.</p>
          </div>
        ) : data?.problems.length === 0 ? (
          <div className="bg-gray-800/50 rounded-xl p-10 text-center">
            <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No problems found matching your criteria.</p>
            <button
              onClick={clearFilters}
              className="mt-4 text-primary hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {data?.problems.map((problem, index) => (
              <motion.div
                key={`${problem.contest_id}-${problem.index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => openProblem(problem.contest_id, problem.index)}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:border-primary/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Problem Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-gray-500 font-mono text-sm">
                        {problem.contest_id}{problem.index}
                      </span>
                      <h3 className="text-white font-medium truncate group-hover:text-primary transition-colors">
                        {problem.name}
                      </h3>
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {problem.tags.slice(0, 5).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-gray-700/50 text-gray-400 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {problem.tags.length > 5 && (
                        <span className="px-2 py-0.5 text-gray-500 text-xs">
                          +{problem.tags.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {/* Solved Count */}
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{problem.solved_count.toLocaleString()}</span>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getDifficultyColor(problem.rating)}`} />
                      <span className={`text-sm font-medium ${problem.rating ? 'text-white' : 'text-gray-500'}`}>
                        {problem.rating || 'Unrated'}
                      </span>
                    </div>

                    {/* External Link Icon */}
                    <ExternalLink className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-4 mt-8"
          >
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            <div className="flex items-center gap-2">
              {/* Show page numbers */}
              {[...Array(Math.min(5, data.total_pages))].map((_, i) => {
                let pageNum;
                if (data.total_pages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= data.total_pages - 2) {
                  pageNum = data.total_pages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-primary text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
              disabled={page === data.total_pages}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* Difficulty Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 bg-gray-800/30 rounded-xl p-4 border border-gray-700/50"
        >
          <h3 className="text-gray-400 text-sm mb-3">Difficulty Legend (Codeforces Rating)</h3>
          <div className="flex flex-wrap gap-4">
            {[
              { min: 800, max: 1199, label: 'Newbie' },
              { min: 1200, max: 1399, label: 'Pupil' },
              { min: 1400, max: 1599, label: 'Specialist' },
              { min: 1600, max: 1899, label: 'Expert' },
              { min: 1900, max: 2099, label: 'Candidate Master' },
              { min: 2100, max: 2399, label: 'Master' },
              { min: 2400, max: 3500, label: 'Grandmaster' },
            ].map(level => (
              <div key={level.label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getDifficultyColor(level.min)}`} />
                <span className="text-gray-400 text-sm">
                  {level.label} ({level.min}-{level.max})
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
