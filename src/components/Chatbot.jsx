'use client';

import { useState, useEffect } from 'react';
import ChatBubble from './ChatBubble';
import RightPanelChat from './RightPanelChat';
import { usePageContext } from '@/hooks/usePageContext';

// Scope chat history to the logged-in user so switching accounts in the
// same browser doesn't leak one user's conversation to another.
function getChatStorageKey() {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.id) return `chatbot-messages-${user.id}`;
  } catch {
    // fall through
  }
  return 'chatbot-messages';
}

export default function Chatbot({ context = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [storageKey, setStorageKey] = useState(null);

  // Get context from current page if not provided as prop
  const pageContext = usePageContext();
  const effectiveContext = context || pageContext;

  // Load conversation history from localStorage on mount
  useEffect(() => {
    const key = getChatStorageKey();
    setStorageKey(key);
    const savedMessages = localStorage.getItem(key);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (storageKey && messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, storageKey]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (isOpen) {
      setHasUnreadMessages(false);
    }
  }, [isOpen]);

  const handleSendMessage = async (content) => {
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          conversationHistory: messages,
          context: effectiveContext, // Include contextual information
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }

    // Mark as having unread messages if chat is closed
    if (!isOpen) {
      setHasUnreadMessages(true);
    }
  };

  const handleToggleChat = () => {
    setIsOpen(prev => !prev);
  };

  const handleClearChat = () => {
    setMessages([]);
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  };

  return (
    <>
      <ChatBubble
        isOpen={isOpen}
        onToggle={handleToggleChat}
        hasUnreadMessages={hasUnreadMessages}
      />
      <RightPanelChat
        isOpen={isOpen}
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        onToggle={handleToggleChat}
        onClearChat={handleClearChat}
        context={effectiveContext}
      />
    </>
  );
}
