import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import { 
  Clock, 
  Trophy,
  Send,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  ArrowLeft
} from 'lucide-react';
import { competeAPI, codeAPI } from '../services/api';
import { useSettingsStore } from '../stores/settingsStore';
import toast from 'react-hot-toast';

const Contest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { programmingLanguage } = useSettingsStore();
  
  const [selectedProblem, setSelectedProblem] = useState(0);
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState({});

  // Fetch contest
  const { data: contestData, isLoading } = useQuery({
    queryKey: ['contest', id],
    queryFn: () => competeAPI.getContest(id),
  });

  // Fetch leaderboard
  const { data: leaderboardData } = useQuery({
    queryKey: ['contestLeaderboard', id],
    queryFn: () => competeAPI.getContestLeaderboard(id),
  });

  const contest = contestData?.data;
  const problems = contest?.problems || [];
  const leaderboard = leaderboardData?.data?.leaderboard || [];

  // Timer
  useEffect(() => {
    if (!contest?.end_time) return;
    
    const endTime = new Date(contest.end_time).getTime();
    
    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        clearInterval(timer);
        toast.error('Contest ended!');
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [contest]);

  useEffect(() => {
    if (problems[selectedProblem]?.starter_code) {
      const starterCode = problems[selectedProblem].starter_code[programmingLanguage];
      setCode(starterCode || '');
    }
  }, [selectedProblem, problems, programmingLanguage]);

  const formatTime = (ms) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await competeAPI.submitSolution(id, {
        problem_index: selectedProblem,
        code,
        language: programmingLanguage,
      });
      
      const result = response.data;
      setSubmissions(prev => ({
        ...prev,
        [selectedProblem]: result,
      }));
      
      if (result.passed) {
        toast.success(`Problem ${String.fromCharCode(65 + selectedProblem)} accepted!`);
      } else {
        toast.error('Solution not accepted');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400">Contest not found</p>
      </div>
    );
  }

  const currentProblem = problems[selectedProblem];

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/compete')}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">{contest.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {contest.participant_count || 0} participants
                </span>
              </div>
            </div>
          </div>
          
          {/* Timer */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            timeLeft < 300000 ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
          }`}>
            <Clock size={18} />
            <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Problem List Sidebar */}
        <div className="w-16 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4 gap-2">
          {problems.map((_, index) => (
            <button
              key={index}
              onClick={() => setSelectedProblem(index)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-colors ${
                selectedProblem === index
                  ? 'bg-blue-600 text-white'
                  : submissions[index]?.passed
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {String.fromCharCode(65 + index)}
            </button>
          ))}
        </div>

        {/* Problem Description */}
        <div className="w-1/3 border-r border-gray-700 overflow-auto p-6">
          {currentProblem && (
            <div className="prose prose-invert max-w-none">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-bold text-white">
                  {String.fromCharCode(65 + selectedProblem)}.
                </span>
                <h2 className="text-xl font-bold text-white m-0">{currentProblem.title}</h2>
              </div>
              
              <div className="flex items-center gap-4 mb-4 text-sm">
                <span className={`px-2 py-1 rounded ${
                  currentProblem.difficulty === 'easy' 
                    ? 'bg-green-500/20 text-green-400'
                    : currentProblem.difficulty === 'medium'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {currentProblem.difficulty}
                </span>
                <span className="text-yellow-400">{currentProblem.points} pts</span>
              </div>

              <p className="text-gray-300 whitespace-pre-wrap">{currentProblem.description}</p>

              {currentProblem.sample_input && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Sample Input</h3>
                  <pre className="p-4 bg-gray-800 rounded-lg text-gray-300 text-sm">
                    {currentProblem.sample_input}
                  </pre>
                </div>
              )}
              
              {currentProblem.sample_output && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Expected Output</h3>
                  <pre className="p-4 bg-gray-800 rounded-lg text-green-400 text-sm">
                    {currentProblem.sample_output}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex flex-col">
          <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
            <select
              value={programmingLanguage}
              className="bg-gray-900 border border-gray-700 rounded px-3 py-1 text-gray-300 text-sm"
              disabled
            >
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="javascript">JavaScript</option>
            </select>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || timeLeft === 0}
              className="flex items-center gap-2 px-4 py-1 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50"
            >
              <Send size={16} />
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
          
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage={programmingLanguage}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                padding: { top: 16 },
              }}
            />
          </div>

          {/* Submission Result */}
          {submissions[selectedProblem] && (
            <div className={`p-4 border-t ${
              submissions[selectedProblem].passed 
                ? 'bg-green-500/10 border-green-500/30' 
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-center gap-2">
                {submissions[selectedProblem].passed ? (
                  <CheckCircle className="text-green-400" size={20} />
                ) : (
                  <XCircle className="text-red-400" size={20} />
                )}
                <span className={submissions[selectedProblem].passed ? 'text-green-400' : 'text-red-400'}>
                  {submissions[selectedProblem].passed ? 'Accepted' : 'Wrong Answer'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="w-64 bg-gray-800 border-l border-gray-700 overflow-auto">
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Trophy className="text-yellow-400" size={18} />
              Leaderboard
            </h3>
          </div>
          <div className="divide-y divide-gray-700">
            {leaderboard.slice(0, 20).map((entry, index) => (
              <div key={entry.user_id} className="px-4 py-2 flex items-center gap-3">
                <span className={`w-6 text-center font-bold ${
                  index === 0 ? 'text-yellow-400' :
                  index === 1 ? 'text-gray-400' :
                  index === 2 ? 'text-orange-400' : 'text-gray-500'
                }`}>
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{entry.username}</p>
                </div>
                <span className="text-blue-400 text-sm font-bold">{entry.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contest;
