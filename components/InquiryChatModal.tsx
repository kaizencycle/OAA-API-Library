/**
 * InquiryChatModal Component
 * 
 * Floating button + modal wrapper for the inquiry chat
 * Provides a persistent chat button that opens the full chat interface
 * 
 * C-151: Conversational Inquiry Chat Interface
 */

import React, { useState, useEffect, useCallback } from 'react';
import InquiryChat from './InquiryChat';

interface InquiryChatModalProps {
  /** Position of the floating button */
  position?: 'bottom-right' | 'bottom-left';
  /** Optional auth token for API calls */
  authToken?: string;
  /** Optional user name for personalization */
  userName?: string;
  /** API base URL */
  apiBaseUrl?: string;
  /** Whether to show the floating button */
  showButton?: boolean;
  /** External control for modal open state */
  isOpen?: boolean;
  /** Callback when modal closes */
  onClose?: () => void;
}

export default function InquiryChatModal({
  position = 'bottom-right',
  authToken,
  userName,
  apiBaseUrl = '/api/inquiry',
  showButton = true,
  isOpen: externalIsOpen,
  onClose: externalOnClose,
}: InquiryChatModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // Use external control if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  
  // Memoize setIsOpen to prevent dependency changes on every render
  const setIsOpen = useCallback((open: boolean) => {
    if (externalOnClose) {
      if (!open) externalOnClose();
    } else {
      setInternalIsOpen(open);
    }
  }, [externalOnClose]);

  // Position classes
  const positionClasses = {
    'bottom-right': 'right-4 bottom-4 sm:right-6 sm:bottom-6',
    'bottom-left': 'left-4 bottom-4 sm:left-6 sm:bottom-6',
  };

  // Clear unread when opening
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, setIsOpen]);

  // Prevent body scroll when modal is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Floating Button */}
      {showButton && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed ${positionClasses[position]} z-50 group`}
          aria-label="Open chat"
        >
          <div className="relative">
            {/* Pulse animation */}
            <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-25" />
            
            {/* Button */}
            <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white transform transition-all duration-200 group-hover:scale-110 group-hover:shadow-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>

            {/* Unread indicator */}
            {hasUnread && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
            )}
          </div>

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            New Inquiry
            <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900" />
          </div>
        </button>
      )}

      {/* Modal Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Modal Container */}
      {isOpen && (
        <div
          className={`fixed z-50 ${positionClasses[position]} w-full sm:w-[400px] md:w-[450px] h-[600px] max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)]`}
          style={{
            // On mobile, take full width with margin
            ...(typeof window !== 'undefined' && window.innerWidth < 640
              ? { left: '0.5rem', right: '0.5rem', width: 'auto' }
              : {}),
          }}
        >
          <div
            className="w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all duration-300 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <InquiryChat
              onClose={() => setIsOpen(false)}
              apiBaseUrl={apiBaseUrl}
              authToken={authToken}
              userName={userName}
            />
          </div>
        </div>
      )}

      {/* Animation styles */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
