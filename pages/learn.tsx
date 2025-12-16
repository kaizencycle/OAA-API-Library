/**
 * Learning Hub Page
 * 
 * OAA Learning Hub with MIC rewards
 * C-170: Learn-to-Earn System
 */

import React, { useState } from 'react';
import Head from 'next/head';
import LearningProgressTracker from '../components/LearningProgressTracker';
import QuizModule from '../components/QuizModule';

// Demo user ID (would come from auth in production)
const DEMO_USER_ID = 'demo_user_001';

interface CompletionResult {
  mic_earned: number;
  xp_earned: number;
  accuracy: number;
  new_level: number;
  transaction_id: string;
  bonuses: Record<string, number>;
}

export default function LearnPage() {
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  function handleStartModule(moduleId: string) {
    setActiveModule(moduleId);
    setCompletionMessage(null);
  }

  function handleModuleComplete(result: CompletionResult) {
    setActiveModule(null);
    setCompletionMessage(
      `🎉 Earned ${result.mic_earned} MIC and ${result.xp_earned} XP!`
    );
    // Clear message after 5 seconds
    setTimeout(() => setCompletionMessage(null), 5000);
  }

  function handleBack() {
    setActiveModule(null);
  }

  return (
    <>
      <Head>
        <title>Learning Hub | OAA - Learn and Earn MIC</title>
        <meta
          name="description"
          content="Learn about Constitutional AI, Integrity Economics, and earn MIC rewards in the OAA Learning Hub."
        />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <a href="/" className="text-gray-500 hover:text-gray-700">
                  ← Home
                </a>
                <span className="text-gray-300">|</span>
                <h1 className="text-xl font-bold text-gray-900">
                  📚 OAA Learning Hub
                </h1>
              </div>
              <div className="text-sm text-gray-500">
                Learn & Earn MIC
              </div>
            </div>
          </div>
        </header>

        {/* Completion Toast */}
        {completionMessage && (
          <div className="fixed top-4 right-4 z-50 animate-fade-in">
            <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg">
              {completionMessage}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {activeModule ? (
            <QuizModule
              moduleId={activeModule}
              userId={DEMO_USER_ID}
              onComplete={handleModuleComplete}
              onBack={handleBack}
            />
          ) : (
            <LearningProgressTracker
              userId={DEMO_USER_ID}
              onStartModule={handleStartModule}
            />
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white mt-auto">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
              <div>
                Learn-to-Earn powered by{' '}
                <span className="font-medium text-gray-700">Mobius Integrity Credits (MIC)</span>
              </div>
              <div className="flex items-center gap-4">
                <a href="/constitution" className="hover:text-gray-700">
                  Constitution
                </a>
                <a href="/ethics" className="hover:text-gray-700">
                  Ethics
                </a>
                <a href="/civic-ai" className="hover:text-gray-700">
                  Civic AI
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
