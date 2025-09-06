'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Bot, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChatContainer, ChatForm, ChatMessages, MessageInput, PromptSuggestions } from '@/components/ui/chat';
import { MessageList } from '@/components/ui/message-list';
import { cn } from '@/lib/utils';

export default function RightPanelChat({ 
  isOpen, 
  onToggle, 
  messages = [], 
  onSendMessage, 
  isLoading = false,
  onClearChat,
  context = null // New prop for contextual information
}) {
  const [input, setInput] = useState('');
  const [localMessages, setLocalMessages] = useState(messages);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Update local messages when props change
  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  // Scroll to bottom when messages change or chat opens
  useEffect(() => {
    if (localMessages.length > 0) {
      // Small delay to ensure DOM has updated
      setTimeout(scrollToBottom, 100);
    }
  }, [localMessages]);

  // Scroll to bottom when chat opens
  useEffect(() => {
    if (isOpen && localMessages.length > 0) {
      // Delay to ensure the panel animation completes
      setTimeout(scrollToBottom, 400);
    }
  }, [isOpen, localMessages.length]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  // Convert messages to the format expected by the Chat component
  const formattedMessages = localMessages.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp || new Date().toISOString()
  }));

  const handleStop = () => {
    // Implement stop functionality if needed
    console.log('Stop generation');
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the conversation? This cannot be undone.')) {
      onClearChat();
    }
  };

  const suggestions = [
    "How do I write a JOIN query?",
    "What's my progress this week?",
    "Show me popular challenges",
    "Explain database normalization",
    "Help me with SQL optimization"
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40 sm:hidden"
        onClick={onToggle}
      />
      
      {/* Right Panel */}
      <Card className={cn(
        "fixed top-0 right-0 h-full w-full sm:w-[400px] lg:w-[600px] z-50",
        "bg-white border-l border-gray-200 shadow-2xl",
        "transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm text-gray-900 truncate">Query Quest Assistant</h3>
              <p className="text-xs text-gray-500">Online • Ready to help</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearChat}
                className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg flex-shrink-0"
                title="Clear conversation"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="h-[calc(100vh-80px)] flex flex-col">
          <ChatContainer className="h-full" ref={chatContainerRef}>
            {formattedMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                  <Bot className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Welcome to Query Quest Assistant</h3>
                  <p className="text-sm text-muted-foreground">
                    I'm here to help you with SQL queries, database concepts, and your learning journey. Ask me anything!
                  </p>
                </div>
                <PromptSuggestions suggestions={suggestions} append={(message) => onSendMessage(message.content)} />
              </div>
            ) : (
              <ChatMessages>
                <MessageList 
                  messages={formattedMessages} 
                  isTyping={isLoading && formattedMessages.length > 0 && formattedMessages[formattedMessages.length - 1]?.role === 'user'}
                  showTimeStamps={true}
                />
                {/* Invisible element to scroll to */}
                <div ref={messagesEndRef} />
              </ChatMessages>
            )}
            
            <ChatForm
              isPending={isLoading}
              handleSubmit={handleSubmit}
              className="mt-auto"
            >
              <MessageInput
                value={input}
                onChange={handleInputChange}
                isGenerating={isLoading}
                stop={handleStop}
              />
            </ChatForm>
          </ChatContainer>
        </div>
      </Card>
    </>
  );
}
