/**
 * QuizModule Component
 * 
 * Interactive quiz component for learning modules with MIC rewards
 * Shows questions, tracks answers, and calculates rewards
 * 
 * C-170: Learn-to-Earn MIC Rewards
 */

import React, { useState, useEffect } from 'react';

// Types
interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  difficulty: string;
  points: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimated_minutes: number;
  mic_reward: number;
  topics: string[];
  questions: Question[];
}

interface QuizState {
  currentQuestion: number;
  answers: Record<string, { selected: number; correct: boolean }>;
  score: number;
  totalPoints: number;
  isComplete: boolean;
  showExplanation: boolean;
}

interface CompletionResult {
  mic_earned: number;
  xp_earned: number;
  accuracy: number;
  new_level: number;
  transaction_id: string;
  bonuses: Record<string, number>;
}

interface Props {
  moduleId: string;
  userId: string;
  onComplete?: (result: CompletionResult) => void;
  onBack?: () => void;
  apiBaseUrl?: string;
}

const MIN_ACCURACY = 0.70;

export default function QuizModule({
  moduleId,
  userId,
  onComplete,
  onBack,
  apiBaseUrl = '/api/learning',
}: Props) {
  const [module, setModule] = useState<Module | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestion: 0,
    answers: {},
    score: 0,
    totalPoints: 0,
    isComplete: false,
    showExplanation: false,
  });
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completionResult, setCompletionResult] = useState<CompletionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState(Date.now());

  // Fetch module and start session
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        // Fetch module details
        const moduleRes = await fetch(`${apiBaseUrl}/modules/${moduleId}`);
        if (!moduleRes.ok) throw new Error('Failed to load module');
        const moduleData = await moduleRes.json();
        setModule(moduleData.module);

        // Calculate total points
        const total = moduleData.module.questions.reduce(
          (sum: number, q: Question) => sum + q.points,
          0
        );
        setQuizState((prev) => ({ ...prev, totalPoints: total }));

        // Start session
        const sessionRes = await fetch(`${apiBaseUrl}/session/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ module_id: moduleId, user_id: userId }),
        });
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          setSessionId(sessionData.session_id);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [moduleId, userId, apiBaseUrl]);

  // Get current question
  const currentQ = module?.questions[quizState.currentQuestion];
  const isLastQuestion = quizState.currentQuestion === (module?.questions.length || 0) - 1;

  // Handle answer selection
  function selectAnswer(index: number) {
    if (quizState.showExplanation) return;
    setSelectedAnswer(index);
  }

  // Submit answer
  async function submitAnswer() {
    if (selectedAnswer === null || !currentQ) return;

    setSubmitting(true);
    const correct = selectedAnswer === currentQ.correct_answer;
    const points = correct ? currentQ.points : 0;

    // Update state
    setQuizState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [currentQ.id]: { selected: selectedAnswer, correct },
      },
      score: prev.score + points,
      showExplanation: true,
    }));

    setSubmitting(false);
  }

  // Move to next question or complete
  async function nextQuestion() {
    if (isLastQuestion) {
      await completeQuiz();
    } else {
      setQuizState((prev) => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
        showExplanation: false,
      }));
      setSelectedAnswer(null);
    }
  }

  // Complete the quiz
  async function completeQuiz() {
    if (!module || !sessionId) return;

    setSubmitting(true);
    const correctAnswers = Object.values(quizState.answers).filter((a) => a.correct).length;
    const accuracy = correctAnswers / module.questions.length;
    const timeSpent = Math.floor((Date.now() - startTime) / 60000);

    try {
      const res = await fetch(`${apiBaseUrl}/session/${sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_id: moduleId,
          user_id: userId,
          questions_answered: module.questions.length,
          correct_answers: correctAnswers,
          total_points: quizState.totalPoints,
          earned_points: quizState.score,
          accuracy,
          time_spent_minutes: timeSpent,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setCompletionResult({
          mic_earned: result.mic_earned,
          xp_earned: result.xp_earned,
          accuracy: result.accuracy,
          new_level: result.new_level,
          transaction_id: result.transaction_id,
          bonuses: result.bonuses || {},
        });
        setQuizState((prev) => ({ ...prev, isComplete: true }));
      } else {
        const err = await res.json();
        setError(err.message || 'Failed to complete quiz');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Handle claiming reward (callback)
  function claimReward() {
    if (onComplete && completionResult) {
      onComplete(completionResult);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading module...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Completion screen
  if (quizState.isComplete && completionResult) {
    const passedThreshold = completionResult.accuracy >= MIN_ACCURACY;
    
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className={`p-6 text-center ${
            passedThreshold 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
              : 'bg-gradient-to-r from-yellow-500 to-orange-500'
          }`}>
            <div className="text-6xl mb-4">
              {passedThreshold ? '🎉' : '📚'}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {passedThreshold ? 'Module Complete!' : 'Keep Learning!'}
            </h2>
            <p className="text-white/90">
              {passedThreshold 
                ? 'Congratulations on your achievement!' 
                : `You need ${(MIN_ACCURACY * 100).toFixed(0)}% accuracy for MIC rewards.`}
            </p>
          </div>

          {/* Stats */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {(completionResult.accuracy * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-gray-500">Accuracy</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">
                  {quizState.score}/{quizState.totalPoints}
                </div>
                <div className="text-sm text-gray-500">Points</div>
              </div>
            </div>

            {/* Rewards */}
            {passedThreshold && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-green-800 mb-3">🏆 Rewards Earned</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💰</span>
                    <div>
                      <div className="font-bold text-green-700">
                        {completionResult.mic_earned} MIC
                      </div>
                      <div className="text-xs text-green-600">Minted</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⭐</span>
                    <div>
                      <div className="font-bold text-purple-700">
                        {completionResult.xp_earned} XP
                      </div>
                      <div className="text-xs text-purple-600">Earned</div>
                    </div>
                  </div>
                </div>

                {/* Bonus Breakdown */}
                {Object.keys(completionResult.bonuses).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <div className="text-xs text-green-700 font-medium mb-2">Reward Breakdown:</div>
                    <div className="space-y-1 text-xs text-green-600">
                      {completionResult.bonuses.base_reward && (
                        <div className="flex justify-between">
                          <span>Base Reward</span>
                          <span>{completionResult.bonuses.base_reward} MIC</span>
                        </div>
                      )}
                      {completionResult.bonuses.accuracy_multiplier && (
                        <div className="flex justify-between">
                          <span>Accuracy Multiplier</span>
                          <span>×{completionResult.bonuses.accuracy_multiplier.toFixed(2)}</span>
                        </div>
                      )}
                      {completionResult.bonuses.perfect_bonus > 0 && (
                        <div className="flex justify-between">
                          <span>Perfect Score Bonus</span>
                          <span>+10%</span>
                        </div>
                      )}
                      {completionResult.bonuses.first_completion_bonus > 0 && (
                        <div className="flex justify-between">
                          <span>First Completion</span>
                          <span>+{completionResult.bonuses.first_completion_bonus} MIC</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Transaction ID */}
            {passedThreshold && completionResult.transaction_id && (
              <div className="text-xs text-gray-500 text-center mb-4">
                Transaction: {completionResult.transaction_id}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onBack}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Back to Modules
              </button>
              {passedThreshold && (
                <button
                  onClick={claimReward}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz in progress
  if (!module || !currentQ) return null;

  const progress = ((quizState.currentQuestion + 1) / module.questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            ← Back
          </button>
          <div className="text-sm text-gray-500">
            Question {quizState.currentQuestion + 1} of {module.questions.length}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Module Title */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{module.title}</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>🏆 {module.mic_reward} MIC</span>
          <span>•</span>
          <span>Score: {quizState.score}/{quizState.totalPoints}</span>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Question */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              currentQ.difficulty === 'easy'
                ? 'bg-green-100 text-green-700'
                : currentQ.difficulty === 'medium'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {currentQ.difficulty}
            </span>
            <span className="text-sm text-gray-500">{currentQ.points} points</span>
          </div>
          <h3 className="text-xl font-medium text-gray-900">{currentQ.question}</h3>
        </div>

        {/* Options */}
        <div className="p-6 space-y-3">
          {currentQ.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === currentQ.correct_answer;
            const showResult = quizState.showExplanation;

            let optionClass = 'border-gray-200 hover:border-blue-300 hover:bg-blue-50';
            if (showResult) {
              if (isCorrect) {
                optionClass = 'border-green-500 bg-green-50';
              } else if (isSelected && !isCorrect) {
                optionClass = 'border-red-500 bg-red-50';
              }
            } else if (isSelected) {
              optionClass = 'border-blue-500 bg-blue-50';
            }

            return (
              <button
                key={index}
                onClick={() => selectAnswer(index)}
                disabled={showResult}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${optionClass} ${
                  showResult ? 'cursor-default' : 'cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    showResult && isCorrect
                      ? 'border-green-500 bg-green-500 text-white'
                      : showResult && isSelected && !isCorrect
                      ? 'border-red-500 bg-red-500 text-white'
                      : isSelected
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300'
                  }`}>
                    {showResult && isCorrect && '✓'}
                    {showResult && isSelected && !isCorrect && '✗'}
                  </div>
                  <span className="text-gray-900">{option}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {quizState.showExplanation && (
          <div className="p-6 bg-blue-50 border-t border-blue-100">
            <h4 className="font-semibold text-blue-900 mb-2">Explanation</h4>
            <p className="text-blue-800">{currentQ.explanation}</p>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
          {!quizState.showExplanation ? (
            <button
              onClick={submitAnswer}
              disabled={selectedAnswer === null || submitting}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                selectedAnswer === null
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {submitting ? 'Checking...' : 'Submit Answer'}
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              {submitting ? 'Processing...' : isLastQuestion ? 'Complete Quiz' : 'Next Question'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
