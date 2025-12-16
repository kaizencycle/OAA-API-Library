/**
 * LearningProgressTracker Component
 * 
 * Main dashboard for the OAA Learning Hub with MIC rewards
 * Shows available modules, user progress, and learning metrics
 * 
 * C-170: Learn-to-Earn MIC Rewards
 */

import React, { useState, useEffect } from 'react';

// Types
interface LearningModule {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_minutes: number;
  mic_reward: number;
  topics: string[];
  prerequisites: string[];
  questions_count: number;
  is_active: boolean;
  completed: boolean;
  progress: number;
}

interface UserProgress {
  user_id: string;
  total_mic_earned: number;
  modules_completed: number;
  current_streak: number;
  longest_streak: number;
  total_learning_minutes: number;
  level: number;
  experience_points: number;
  next_level_xp: number;
  integrity_score: number;
  badges: Badge[];
  completed_modules: CompletedModule[];
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned_at: string;
  rarity: string;
}

interface CompletedModule {
  module_id: string;
  completed_at: string;
  accuracy: number;
  mic_earned: number;
}

interface SystemStatus {
  global_integrity_index: number;
  circuit_breaker_status: string;
  gii_multiplier: number;
  minting_enabled: boolean;
}

interface Props {
  userId?: string;
  onStartModule?: (moduleId: string) => void;
  apiBaseUrl?: string;
}

const difficultyColors = {
  beginner: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  intermediate: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  advanced: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
};

const difficultyLabels = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export default function LearningProgressTracker({
  userId = 'demo_user',
  onStartModule,
  apiBaseUrl = '/api/learning',
}: Props) {
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [userId]);

  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      // Fetch in parallel
      const [modulesRes, progressRes, statusRes] = await Promise.all([
        fetch(`${apiBaseUrl}/modules?user_id=${userId}`),
        fetch(`${apiBaseUrl}/progress/${userId}`),
        fetch(`${apiBaseUrl}/system-status`),
      ]);

      if (modulesRes.ok) {
        const data = await modulesRes.json();
        setModules(data.modules || []);
      }

      if (progressRes.ok) {
        const data = await progressRes.json();
        setProgress(data);
      }

      if (statusRes.ok) {
        const data = await statusRes.json();
        setSystemStatus(data);
      }
    } catch (err: any) {
      console.error('Failed to fetch learning data:', err);
      setError('Failed to load learning data');
    } finally {
      setLoading(false);
    }
  }

  function handleStartModule(moduleId: string) {
    if (onStartModule) {
      onStartModule(moduleId);
    }
  }

  // Filter modules
  const filteredModules = modules.filter((m) => {
    if (filter === 'all') return true;
    if (filter === 'completed') return m.completed;
    if (filter === 'available') return !m.completed;
    return m.difficulty === filter;
  });

  // Calculate XP progress percentage
  const xpProgress = progress
    ? Math.min((progress.experience_points / progress.next_level_xp) * 100, 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading learning hub...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchData}
          className="mt-2 text-sm text-red-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with System Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📚 Learning Hub</h2>
          <p className="text-gray-600">Learn and earn MIC rewards</p>
        </div>
        
        {systemStatus && (
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            systemStatus.circuit_breaker_status === 'healthy'
              ? 'bg-green-100 text-green-800'
              : systemStatus.circuit_breaker_status === 'warning'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            GII: {(systemStatus.global_integrity_index * 100).toFixed(0)}%
            {systemStatus.circuit_breaker_status === 'healthy' ? ' ✓' : ' ⚠'}
          </div>
        )}
      </div>

      {/* Progress Dashboard */}
      {progress && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              🏆 Your Learning Journey
            </h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Level {progress.level}
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <div className="text-2xl font-bold text-green-600">
                {progress.total_mic_earned}
              </div>
              <div className="text-xs text-gray-500">MIC Earned</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <div className="text-2xl font-bold text-blue-600">
                {progress.modules_completed}
              </div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <div className="text-2xl font-bold text-orange-600">
                {progress.current_streak}🔥
              </div>
              <div className="text-xs text-gray-500">Streak</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <div className="text-2xl font-bold text-purple-600">
                {progress.total_learning_minutes}m
              </div>
              <div className="text-xs text-gray-500">Time</div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>XP Progress</span>
              <span>{progress.experience_points}/{progress.next_level_xp}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>

          {/* Badges */}
          {progress.badges.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {progress.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-1 px-2 py-1 bg-white rounded-full text-sm shadow-sm"
                  title={badge.description}
                >
                  <span>{badge.icon}</span>
                  <span className="text-gray-700">{badge.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['all', 'available', 'completed', 'beginner', 'intermediate', 'advanced'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Module Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredModules.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            onStart={() => handleStartModule(module.id)}
          />
        ))}
      </div>

      {filteredModules.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No modules found for this filter.
        </div>
      )}
    </div>
  );
}

// Module Card Component
function ModuleCard({
  module,
  onStart,
}: {
  module: LearningModule;
  onStart: () => void;
}) {
  const colors = difficultyColors[module.difficulty];

  return (
    <div
      className={`bg-white rounded-xl border ${colors.border} shadow-sm hover:shadow-md transition-shadow overflow-hidden`}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 flex-1 pr-2">
            {module.title}
            {module.completed && (
              <span className="ml-2 text-green-600">✓</span>
            )}
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {module.description}
        </p>

        {/* Meta Info */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span>⏱️ {module.estimated_minutes} min</span>
          <span>🧠 {module.questions_count} questions</span>
        </div>

        {/* Topics */}
        <div className="flex flex-wrap gap-1 mb-3">
          <span className={`px-2 py-0.5 rounded-full text-xs ${colors.bg} ${colors.text}`}>
            {difficultyLabels[module.difficulty]}
          </span>
          {module.topics.slice(0, 2).map((topic) => (
            <span
              key={topic}
              className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-lg">🏆</span>
          <span className="font-bold text-green-600">{module.mic_reward} MIC</span>
        </div>
        <button
          onClick={onStart}
          disabled={module.completed}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            module.completed
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {module.completed ? 'Completed' : 'Start Learning'}
        </button>
      </div>
    </div>
  );
}
